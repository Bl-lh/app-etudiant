import fs from 'fs';
import path from 'path';

/**
 * Générateur de rapport de couverture au format officiel JaCoCo XML (DTD Report 1.1)
 * à partir du fichier coverage-final.json généré par Jest ou Vitest (Istanbul / v8).
 */
export function generateJaCoCoXml(jsonPath, outputPath, reportName = 'CampusEnroll Frontend Coverage') {
  if (!fs.existsSync(jsonPath)) {
    console.warn(`[JaCoCo Gen] Fichier source introuvable : ${jsonPath}`);
    return;
  }

  const raw = fs.readFileSync(jsonPath, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error(`[JaCoCo Gen] Erreur de parsing JSON pour ${jsonPath}:`, e.message);
    return;
  }

  let totalInstCovered = 0, totalInstMissed = 0;
  let totalBranchCovered = 0, totalBranchMissed = 0;
  let totalLineCovered = 0, totalLineMissed = 0;
  let totalFuncCovered = 0, totalFuncMissed = 0;
  let totalClassCovered = 0, totalClassMissed = 0;

  const packagesMap = {};

  for (const [filePath, fileData] of Object.entries(data)) {
    // Normaliser le nom de package à partir du chemin relatif
    const relPath = filePath.replace(/.*\/frontend\/src\//, '').replace(/.*\/src\//, '');
    const dirName = path.dirname(relPath);
    const pkgName = dirName === '.' ? 'src' : `src/${dirName}`;
    const baseName = path.basename(relPath);
    const className = baseName.replace(/\.[^/.]+$/, '');

    if (!packagesMap[pkgName]) {
      packagesMap[pkgName] = [];
    }

    // Calculer les métriques
    const s = fileData.s || {};
    let instCov = 0, instMiss = 0;
    for (const count of Object.values(s)) {
      if (count > 0) instCov++;
      else instMiss++;
    }

    const f = fileData.f || {};
    let funcCov = 0, funcMiss = 0;
    for (const count of Object.values(f)) {
      if (count > 0) funcCov++;
      else funcMiss++;
    }

    const b = fileData.b || {};
    let branchCov = 0, branchMiss = 0;
    for (const branches of Object.values(b)) {
      if (Array.isArray(branches)) {
        for (const count of branches) {
          if (count > 0) branchCov++;
          else branchMiss++;
        }
      }
    }

    // Calcul des lignes couvertes
    const lineStats = {};
    if (fileData.statementMap) {
      for (const [key, loc] of Object.entries(fileData.statementMap)) {
        const line = loc.start?.line;
        if (line) {
          const hits = s[key] || 0;
          lineStats[line] = (lineStats[line] || 0) + hits;
        }
      }
    }
    let lineCov = 0, lineMiss = 0;
    for (const hits of Object.values(lineStats)) {
      if (hits > 0) lineCov++;
      else lineMiss++;
    }

    const isClassCovered = (instCov > 0);
    if (isClassCovered) totalClassCovered++;
    else totalClassMissed++;

    totalInstCovered += instCov; totalInstMissed += instMiss;
    totalBranchCovered += branchCov; totalBranchMissed += branchMiss;
    totalLineCovered += lineCov; totalLineMissed += lineMiss;
    totalFuncCovered += funcCov; totalFuncMissed += funcMiss;

    packagesMap[pkgName].push({
      className,
      sourcefilename: baseName,
      instCov, instMiss,
      branchCov, branchMiss,
      lineCov, lineMiss,
      funcCov, funcMiss,
      isClassCovered,
      lineStats
    });
  }

  // Générer le XML JaCoCo conforme DTD 1.1
  let xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  xml += '<!DOCTYPE report PUBLIC "-//JACOCO//DTD Report 1.1//EN" "report.dtd">\n';
  xml += `<report name="${escapeXml(reportName)}">\n`;

  for (const [pkgName, classes] of Object.entries(packagesMap)) {
    xml += `  <package name="${escapeXml(pkgName)}">\n`;

    let pkgInstCov = 0, pkgInstMiss = 0;
    let pkgBranchCov = 0, pkgBranchMiss = 0;
    let pkgLineCov = 0, pkgLineMiss = 0;
    let pkgFuncCov = 0, pkgFuncMiss = 0;
    let pkgClassCov = 0, pkgClassMiss = 0;

    for (const c of classes) {
      pkgInstCov += c.instCov; pkgInstMiss += c.instMiss;
      pkgBranchCov += c.branchCov; pkgBranchMiss += c.branchMiss;
      pkgLineCov += c.lineCov; pkgLineMiss += c.lineMiss;
      pkgFuncCov += c.funcCov; pkgFuncMiss += c.funcMiss;
      if (c.isClassCovered) pkgClassCov++; else pkgClassMiss++;

      xml += `    <class name="${escapeXml(pkgName + '/' + c.className)}" sourcefilename="${escapeXml(c.sourcefilename)}">\n`;
      xml += `      <counter type="INSTRUCTION" missed="${c.instMiss}" covered="${c.instCov}"/>\n`;
      if (c.branchCov + c.branchMiss > 0) {
        xml += `      <counter type="BRANCH" missed="${c.branchMiss}" covered="${c.branchCov}"/>\n`;
      }
      xml += `      <counter type="LINE" missed="${c.lineMiss}" covered="${c.lineCov}"/>\n`;
      xml += `      <counter type="COMPLEXITY" missed="${c.branchMiss}" covered="${c.branchCov + 1}"/>\n`;
      xml += `      <counter type="METHOD" missed="${c.funcMiss}" covered="${c.funcCov}"/>\n`;
      xml += `      <counter type="CLASS" missed="${c.isClassCovered ? 0 : 1}" covered="${c.isClassCovered ? 1 : 0}"/>\n`;
      xml += `    </class>\n`;
    }

    // Sourcefiles
    for (const c of classes) {
      xml += `    <sourcefile name="${escapeXml(c.sourcefilename)}">\n`;
      for (const [lineNr, hits] of Object.entries(c.lineStats)) {
        xml += `      <line nr="${lineNr}" mi="${hits === 0 ? 1 : 0}" ci="${hits > 0 ? 1 : 0}" mb="0" cb="0"/>\n`;
      }
      xml += `      <counter type="INSTRUCTION" missed="${c.instMiss}" covered="${c.instCov}"/>\n`;
      if (c.branchCov + c.branchMiss > 0) {
        xml += `      <counter type="BRANCH" missed="${c.branchMiss}" covered="${c.branchCov}"/>\n`;
      }
      xml += `      <counter type="LINE" missed="${c.lineMiss}" covered="${c.lineCov}"/>\n`;
      xml += `      <counter type="COMPLEXITY" missed="${c.branchMiss}" covered="${c.branchCov + 1}"/>\n`;
      xml += `      <counter type="METHOD" missed="${c.funcMiss}" covered="${c.funcCov}"/>\n`;
      xml += `      <counter type="CLASS" missed="${c.isClassCovered ? 0 : 1}" covered="${c.isClassCovered ? 1 : 0}"/>\n`;
      xml += `    </sourcefile>\n`;
    }

    // Compteurs Package
    xml += `    <counter type="INSTRUCTION" missed="${pkgInstMiss}" covered="${pkgInstCov}"/>\n`;
    if (pkgBranchCov + pkgBranchMiss > 0) {
      xml += `    <counter type="BRANCH" missed="${pkgBranchMiss}" covered="${pkgBranchCov}"/>\n`;
    }
    xml += `    <counter type="LINE" missed="${pkgLineMiss}" covered="${pkgLineCov}"/>\n`;
    xml += `    <counter type="COMPLEXITY" missed="${pkgBranchMiss}" covered="${pkgBranchCov + classes.length}"/>\n`;
    xml += `    <counter type="METHOD" missed="${pkgFuncMiss}" covered="${pkgFuncCov}"/>\n`;
    xml += `    <counter type="CLASS" missed="${pkgClassMiss}" covered="${pkgClassCov}"/>\n`;
    xml += `  </package>\n`;
  }

  // Compteurs Globaux Bundle
  xml += `  <counter type="INSTRUCTION" missed="${totalInstMissed}" covered="${totalInstCovered}"/>\n`;
  if (totalBranchCovered + totalBranchMissed > 0) {
    xml += `  <counter type="BRANCH" missed="${totalBranchMissed}" covered="${totalBranchCovered}"/>\n`;
  }
  xml += `  <counter type="LINE" missed="${totalLineMissed}" covered="${totalLineCovered}"/>\n`;
  xml += `  <counter type="COMPLEXITY" missed="${totalBranchMissed}" covered="${totalBranchCovered + totalClassCovered}"/>\n`;
  xml += `  <counter type="METHOD" missed="${totalFuncMissed}" covered="${totalFuncCovered}"/>\n`;
  xml += `  <counter type="CLASS" missed="${totalClassMissed}" covered="${totalClassCovered}"/>\n`;
  xml += `</report>\n`;

  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outputPath, xml, 'utf8');
  console.log(`✓ [JaCoCo XML] Rapport généré avec succès dans : ${outputPath}`);
}

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

// Exécution directe CLI si appelé par node scripts/generate-jacoco.js
const argTarget = process.argv[2] || 'vitest';
if (argTarget === 'jest') {
  generateJaCoCoXml('coverage-jest/coverage-final.json', 'coverage-jest/jacoco.xml', 'CampusEnroll Frontend - Jest Coverage');
} else {
  generateJaCoCoXml('coverage/coverage-final.json', 'coverage/jacoco.xml', 'CampusEnroll Frontend - Vitest Coverage');
}
