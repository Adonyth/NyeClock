
    // ========================================================================
    //  BAZI ANALYSIS ENGINE EXPANSION
    //  New functions: Yongshen, Element Proportions, Pie Chart, Yuan Tiangang
    //  Bone Weight, Interaction Analysis, Classical References, Full Renderer
    // ========================================================================

    /* ---- Hidden stems (藏干) for each earthly branch ---- */
    const BRANCH_HIDDEN_STEMS = {
      '子': ['癸'],
      '丑': ['己', '癸', '辛'],
      '寅': ['甲', '丙', '戊'],
      '卯': ['乙'],
      '辰': ['戊', '乙', '癸'],
      '巳': ['丙', '庚', '戊'],
      '午': ['丁', '己'],
      '未': ['己', '丁', '乙'],
      '申': ['庚', '壬', '戊'],
      '酉': ['辛'],
      '戌': ['戊', '辛', '丁'],
      '亥': ['壬', '甲']
    };

    /* ---- Month branch seasonal strength multipliers ---- */
    const SEASON_ELEMENT = {
      '寅': 'wood', '卯': 'wood', '辰': 'earth',
      '巳': 'fire', '午': 'fire', '未': 'earth',
      '申': 'metal', '酉': 'metal', '戌': 'earth',
      '亥': 'water', '子': 'water', '丑': 'earth'
    };

    // =====================================================================
    // 3. Five-Element Proportion Calculation (baziElementProportions)
    // =====================================================================
    function baziElementProportions(pillars) {
      var counts = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
      var keys = ['y', 'm', 'd', 'h'];
      for (var k = 0; k < keys.length; k++) {
        var gz = pillars[keys[k]];
        if (!gz || gz.length < 2) continue;
        var s = gz.charAt(0);
        var b = gz.charAt(1);
        // Count stem element
        if (stemInfo[s]) {
          counts[stemInfo[s].element] += 1;
        }
        // Count branch element
        if (branchInfo[b]) {
          counts[branchInfo[b].element] += 1;
        }
        // Count hidden stems in branch
        var hidden = BRANCH_HIDDEN_STEMS[b];
        if (hidden) {
          for (var h = 0; h < hidden.length; h++) {
            var hStem = hidden[h];
            if (stemInfo[hStem]) {
              // Main qi gets full weight, middle qi partial, residual qi minor
              var weight = (h === 0) ? 0.6 : (h === 1) ? 0.3 : 0.1;
              counts[stemInfo[hStem].element] += weight;
            }
          }
        }
      }
      // Round to 2 decimal places
      for (var el in counts) {
        counts[el] = Math.round(counts[el] * 100) / 100;
      }
      return counts;
    }

    // =====================================================================
    // 1 & 2. Yongshen (用神) Determination + Strong/Weak Assessment
    // =====================================================================
    function baziYongshen(pillars, gender) {
      var dm = pillars.d.charAt(0);
      var dmInf = stemInfo[dm];
      if (!dmInf) return null;
      var dmElement = dmInf.element;
      var zh = (typeof currentLocale !== 'undefined') ? currentLocale === 'zh' : false;

      // Five element cycle data
      var generates = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
      var controls = { wood: 'earth', fire: 'metal', earth: 'water', metal: 'wood', water: 'fire' };
      var generatedBy = { wood: 'water', fire: 'wood', earth: 'fire', metal: 'earth', water: 'metal' };
      var controlledBy = { wood: 'metal', fire: 'water', earth: 'wood', metal: 'fire', water: 'earth' };

      // Get element proportions
      var props = baziElementProportions(pillars);

      // Supporting elements: same element + element that generates day master
      var supportEl = dmElement;
      var resourceEl = generatedBy[dmElement];
      var supportScore = props[supportEl] + props[resourceEl];

      // Draining elements: what DM generates + what DM controls + what controls DM
      var outputEl = generates[dmElement];
      var wealthEl = controls[dmElement];
      var powerEl = controlledBy[dmElement];
      var drainScore = props[outputEl] + props[wealthEl] + props[powerEl];

      // Month branch season check — the month pillar branch heavily influences strength
      var monthBranch = pillars.m.charAt(1);
      var seasonEl = SEASON_ELEMENT[monthBranch];
      var monthBoost = 0;
      if (seasonEl === dmElement) monthBoost = 1.5;
      else if (seasonEl === resourceEl) monthBoost = 0.8;
      else if (seasonEl === powerEl) monthBoost = -0.8;
      else if (seasonEl === outputEl || seasonEl === wealthEl) monthBoost = -0.5;

      supportScore += monthBoost;

      var isStrong = supportScore >= drainScore;

      // Determine Yongshen (useful god), Xishen (favorable), Jishen (unfavorable)
      var yongshen, xishen, jishen;
      if (isStrong) {
        // Strong day master needs draining/controlling
        yongshen = powerEl;     // element that controls DM
        xishen = outputEl;      // element DM generates (food/hurting officer)
        jishen = resourceEl;    // element that generates DM (seal) would over-strengthen
      } else {
        // Weak day master needs support
        yongshen = resourceEl;  // element that generates DM
        xishen = dmElement;     // same element (companions)
        jishen = powerEl;       // element that controls DM would further weaken
      }

      // Build reasoning string
      var reasoning;
      var elZh = BAZI_ELEM_ZH;
      if (zh) {
        reasoning = '日主 ' + dm + '（' + elZh[dmElement] + '），';
        reasoning += isStrong ? '身强' : '身弱';
        reasoning += '。扶助力 ' + supportScore.toFixed(1) + '（' + elZh[supportEl] + '+' + elZh[resourceEl] + '）';
        reasoning += '，消耗力 ' + drainScore.toFixed(1) + '（' + elZh[outputEl] + '+' + elZh[wealthEl] + '+' + elZh[powerEl] + '）。';
        reasoning += '月令 ' + monthBranch + '（' + elZh[seasonEl] + '）';
        reasoning += monthBoost > 0 ? '得令加持。' : monthBoost < 0 ? '失令减弱。' : '中性。';
        reasoning += isStrong
          ? '宜用 ' + elZh[yongshen] + '（用神）抑制过旺，' + elZh[xishen] + '（喜神）泄秀。忌 ' + elZh[jishen] + '（忌神）再加力。'
          : '宜用 ' + elZh[yongshen] + '（用神）生扶日主，' + elZh[xishen] + '（喜神）帮身。忌 ' + elZh[jishen] + '（忌神）克泄。';
      } else {
        reasoning = 'Day Master ' + dm + ' (' + dmElement + '), assessed as ' + (isStrong ? 'STRONG' : 'WEAK') + '. ';
        reasoning += 'Support score ' + supportScore.toFixed(1) + ' (' + supportEl + '+' + resourceEl + ') ';
        reasoning += 'vs drain score ' + drainScore.toFixed(1) + ' (' + outputEl + '+' + wealthEl + '+' + powerEl + '). ';
        reasoning += 'Month branch ' + monthBranch + ' (' + seasonEl + ') ';
        reasoning += monthBoost > 0 ? 'boosts DM.' : monthBoost < 0 ? 'weakens DM.' : 'is neutral.';
        reasoning += isStrong
          ? ' Use ' + yongshen + ' (yongshen) to restrain excess, ' + xishen + ' (xishen) to drain. Avoid ' + jishen + ' (jishen) over-support.'
          : ' Use ' + yongshen + ' (yongshen) to nourish DM, ' + xishen + ' (xishen) to assist. Avoid ' + jishen + ' (jishen) further weakening.';
      }

      return {
        dayMaster: dm,
        dayMasterElement: dmElement,
        isStrong: isStrong,
        yongshen: yongshen,
        xishen: xishen,
        jishen: jishen,
        supportScore: supportScore,
        drainScore: drainScore,
        reasoning: reasoning
      };
    }

    // =====================================================================
    // 4. Five-Element Pie Chart SVG Generator
    // =====================================================================
    function baziElementPieChartSVG(proportions) {
      var elems = BAZI_ELEM_ORDER;
      var total = 0;
      for (var i = 0; i < elems.length; i++) {
        total += (proportions[elems[i]] || 0);
      }
      if (total === 0) total = 1;

      var cx = 100, cy = 100, r = 80;
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">';
      svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>';

      var startAngle = -Math.PI / 2;

      for (var j = 0; j < elems.length; j++) {
        var el = elems[j];
        var value = proportions[el] || 0;
        if (value <= 0) continue;
        var sliceAngle = (value / total) * 2 * Math.PI;
        var endAngle = startAngle + sliceAngle;

        var x1 = cx + r * Math.cos(startAngle);
        var y1 = cy + r * Math.sin(startAngle);
        var x2 = cx + r * Math.cos(endAngle);
        var y2 = cy + r * Math.sin(endAngle);
        var largeArc = sliceAngle > Math.PI ? 1 : 0;

        var color = elementColor[el] ? elementColor[el].yang : '#888';
        svg += '<path d="M' + cx + ',' + cy + ' L' + x1.toFixed(2) + ',' + y1.toFixed(2);
        svg += ' A' + r + ',' + r + ' 0 ' + largeArc + ',1 ' + x2.toFixed(2) + ',' + y2.toFixed(2) + ' Z"';
        svg += ' fill="' + color + '" stroke="rgba(0,0,0,0.4)" stroke-width="1" opacity="0.85"/>';

        var midAngle = startAngle + sliceAngle / 2;
        var labelR = r * 0.6;
        var lx = cx + labelR * Math.cos(midAngle);
        var ly = cy + labelR * Math.sin(midAngle);
        var pct = Math.round(value / total * 100);
        var elLabel = BAZI_ELEM_ZH[el] || el;
        if (pct >= 5) {
          svg += '<text x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" text-anchor="middle" dominant-baseline="central"';
          svg += ' fill="#fff" font-size="11" font-family="sans-serif" font-weight="500">';
          svg += elLabel + ' ' + pct + '%</text>';
        }

        startAngle = endAngle;
      }

      svg += '</svg>';
      return svg;
    }

    // =====================================================================
    // 5. Yuan Tiangang Bone Weight (称骨算命)
    // =====================================================================
    function baziYuanTiangangWeight(yearGZ, monthGZ, dayGZ, hourGZ) {
      // Year weight: keyed by the 60 sexagenary cycle GZ pair (liang.qian)
      var yearWeights = {
        '甲子': 1.2, '乙丑': 0.9, '丙寅': 0.6, '丁卯': 0.7, '戊辰': 1.2, '己巳': 0.5,
        '庚午': 0.9, '辛未': 0.8, '壬申': 0.7, '癸酉': 0.8, '甲戌': 1.5, '乙亥': 0.9,
        '丙子': 1.6, '丁丑': 0.8, '戊寅': 0.8, '己卯': 1.9, '庚辰': 1.2, '辛巳': 0.6,
        '壬午': 0.8, '癸未': 0.7, '甲申': 0.5, '乙酉': 1.5, '丙戌': 0.6, '丁亥': 1.6,
        '戊子': 1.5, '己丑': 0.7, '庚寅': 0.9, '辛卯': 1.2, '壬辰': 1.0, '癸巳': 0.7,
        '甲午': 1.5, '乙未': 0.6, '丙申': 0.5, '丁酉': 1.4, '戊戌': 1.5, '己亥': 0.9,
        '庚子': 0.7, '辛丑': 0.7, '壬寅': 0.9, '癸卯': 1.2, '甲辰': 0.8, '乙巳': 0.7,
        '丙午': 1.3, '丁未': 0.5, '戊申': 1.4, '己酉': 0.5, '庚戌': 0.9, '辛亥': 1.7,
        '壬子': 0.5, '癸丑': 0.7, '甲寅': 1.2, '乙卯': 0.8, '丙辰': 0.8, '丁巳': 0.6,
        '戊午': 1.9, '己未': 0.6, '庚申': 0.8, '辛酉': 1.6, '壬戌': 1.0, '癸亥': 0.7
      };

      // Month weight: by branch of the month pillar
      var monthWeightsByBranch = {
        '寅': 0.7, '卯': 1.8, '辰': 1.7, '巳': 0.8, '午': 1.5, '未': 0.6,
        '申': 1.5, '酉': 1.6, '戌': 0.8, '亥': 0.9, '子': 0.5, '丑': 0.6
      };

      // Day weight: approximate by branch of the day pillar
      var dayWeightsByBranch = {
        '子': 1.6, '丑': 0.8, '寅': 0.7, '卯': 1.0, '辰': 1.7, '巳': 0.9,
        '午': 1.5, '未': 0.8, '申': 0.8, '酉': 1.6, '戌': 0.9, '亥': 0.6
      };

      // Hour weight: by earthly branch of the hour
      var hourWeightsByBranch = {
        '子': 1.6, '丑': 0.6, '寅': 0.7, '卯': 1.0, '辰': 0.9, '巳': 1.6,
        '午': 1.0, '未': 0.8, '申': 0.8, '酉': 0.9, '戌': 0.6, '亥': 0.6
      };

      var yW = yearWeights[yearGZ] || 0.7;
      var mBranch = monthGZ.charAt(1);
      var dBranch = dayGZ.charAt(1);
      var hBranch = hourGZ.charAt(1);
      var mW = monthWeightsByBranch[mBranch] || 0.8;
      var dW = dayWeightsByBranch[dBranch] || 0.8;
      var hW = hourWeightsByBranch[hBranch] || 0.8;

      var totalRaw = yW + mW + dW + hW;
      var totalFixed = Math.round(totalRaw * 10) / 10;
      var liang = Math.floor(totalFixed);
      var qian = Math.round((totalFixed - liang) * 10);

      var fortuneTable = [
        { min: 0, max: 2.1, zh: '一生劳碌奔波，需自立更生，晚年方见安宁。', en: 'A life of hard work and self-reliance; peace comes in later years.' },
        { min: 2.1, max: 2.8, zh: '劳多得少，早年辛苦，中年渐好，晚年安乐。', en: 'Much effort for modest returns early; gradual improvement, comfortable later years.' },
        { min: 2.8, max: 3.5, zh: '中等之命，勤劳可致小康，一生平稳。', en: 'A moderate destiny; diligence brings modest prosperity and stability.' },
        { min: 3.5, max: 4.0, zh: '福禄双全，中年发达，衣食无忧。', en: 'Blessed with both fortune and status; prosperity from middle age, no want for necessities.' },
        { min: 4.0, max: 4.9, zh: '富贵之命，聪明能干，事业有成，一生顺遂。', en: 'A destiny of wealth and honor; intelligent and capable, career success, a smooth life.' },
        { min: 4.9, max: 5.5, zh: '贵人扶持，名利双收，一生荣华富贵。', en: 'Supported by benefactors, achieving both fame and fortune; a life of splendor.' },
        { min: 5.5, max: 7.2, zh: '大富大贵，福寿绵长，天赋异禀之命。', en: 'Great wealth and nobility; long life and blessings; an extraordinary destiny.' }
      ];

      var fortune = fortuneTable[2];
      for (var f = 0; f < fortuneTable.length; f++) {
        if (totalFixed >= fortuneTable[f].min && totalFixed < fortuneTable[f].max) {
          fortune = fortuneTable[f];
          break;
        }
      }
      if (totalFixed >= 5.5) fortune = fortuneTable[fortuneTable.length - 1];

      return {
        totalWeight: totalFixed,
        weightLiang: liang,
        weightQian: qian,
        fortune: fortune.en,
        fortuneZh: fortune.zh
      };
    }

    // =====================================================================
    // 6. Interaction Analysis (合冲刑害 - baziInteractions)
    // =====================================================================
    function baziInteractions(pillars) {
      var results = [];
      var keys = ['y', 'm', 'd', 'h'];
      var pillarLabelsZh = { y: '年柱', m: '月柱', d: '日柱', h: '时柱' };
      var pillarLabelsEn = { y: 'Year', m: 'Month', d: 'Day', h: 'Hour' };

      var stems = {};
      var branches = {};
      for (var k = 0; k < keys.length; k++) {
        var key = keys[k];
        var gz = pillars[key];
        if (gz && gz.length >= 2) {
          stems[key] = gz.charAt(0);
          branches[key] = gz.charAt(1);
        }
      }

      // --- 天干合 Stem Combinations ---
      var stemCombos = [
        ['甲', '己', 'earth', '化土'],
        ['乙', '庚', 'metal', '化金'],
        ['丙', '辛', 'water', '化水'],
        ['丁', '壬', 'wood', '化木'],
        ['戊', '癸', 'fire', '化火']
      ];
      for (var i = 0; i < keys.length; i++) {
        for (var j = i + 1; j < keys.length; j++) {
          var si = stems[keys[i]];
          var sj = stems[keys[j]];
          if (!si || !sj) continue;
          for (var sc = 0; sc < stemCombos.length; sc++) {
            var combo = stemCombos[sc];
            if ((si === combo[0] && sj === combo[1]) || (si === combo[1] && sj === combo[0])) {
              results.push({
                type: 'stem_combine',
                typeZh: '天干合',
                typeEn: 'Stem Combination',
                positions: [keys[i], keys[j]],
                chars: [si, sj],
                descZh: pillarLabelsZh[keys[i]] + '干' + si + '与' + pillarLabelsZh[keys[j]] + '干' + sj + '相合（' + combo[3] + '）',
                descEn: pillarLabelsEn[keys[i]] + ' stem ' + si + ' combines with ' + pillarLabelsEn[keys[j]] + ' stem ' + sj + ' (transforms to ' + combo[2] + ')'
              });
            }
          }
        }
      }

      // --- 地支六合 Branch Six Harmonies ---
      var branchSixHe = [
        ['子', '丑', 'earth', '化土'],
        ['寅', '亥', 'wood', '化木'],
        ['卯', '戌', 'fire', '化火'],
        ['辰', '酉', 'metal', '化金'],
        ['巳', '申', 'water', '化水'],
        ['午', '未', 'fire/earth', '化火/土']
      ];
      for (var i2 = 0; i2 < keys.length; i2++) {
        for (var j2 = i2 + 1; j2 < keys.length; j2++) {
          var bi2 = branches[keys[i2]];
          var bj2 = branches[keys[j2]];
          if (!bi2 || !bj2) continue;
          for (var bh = 0; bh < branchSixHe.length; bh++) {
            var he = branchSixHe[bh];
            if ((bi2 === he[0] && bj2 === he[1]) || (bi2 === he[1] && bj2 === he[0])) {
              results.push({
                type: 'branch_liuhe',
                typeZh: '地支六合',
                typeEn: 'Branch Six Harmony',
                positions: [keys[i2], keys[j2]],
                chars: [bi2, bj2],
                descZh: pillarLabelsZh[keys[i2]] + '支' + bi2 + '与' + pillarLabelsZh[keys[j2]] + '支' + bj2 + '成六合（' + he[3] + '）',
                descEn: pillarLabelsEn[keys[i2]] + ' branch ' + bi2 + ' forms liuhe with ' + pillarLabelsEn[keys[j2]] + ' branch ' + bj2 + ' (transforms to ' + he[2] + ')'
              });
            }
          }
        }
      }

      // --- 地支三合 Branch Three Harmonies ---
      var sanheGroups = [
        { branches: ['申', '子', '辰'], element: 'water', zh: '水局' },
        { branches: ['亥', '卯', '未'], element: 'wood', zh: '木局' },
        { branches: ['寅', '午', '戌'], element: 'fire', zh: '火局' },
        { branches: ['巳', '酉', '丑'], element: 'metal', zh: '金局' }
      ];
      var branchArr = [];
      for (var bk = 0; bk < keys.length; bk++) {
        if (branches[keys[bk]]) branchArr.push({ key: keys[bk], branch: branches[keys[bk]] });
      }
      for (var sg = 0; sg < sanheGroups.length; sg++) {
        var group = sanheGroups[sg];
        var matched = [];
        for (var ba = 0; ba < branchArr.length; ba++) {
          if (group.branches.indexOf(branchArr[ba].branch) >= 0) {
            matched.push(branchArr[ba]);
          }
        }
        if (matched.length >= 2) {
          var posArr = [];
          var charArr = [];
          for (var mm = 0; mm < matched.length; mm++) {
            posArr.push(matched[mm].key);
            charArr.push(matched[mm].branch);
          }
          var fullOrPartial = matched.length === 3;
          results.push({
            type: 'branch_sanhe',
            typeZh: '地支三合',
            typeEn: 'Branch Three Harmony',
            positions: posArr,
            chars: charArr,
            full: fullOrPartial,
            descZh: charArr.join('') + (fullOrPartial ? ' 三合' : ' 半合') + group.zh,
            descEn: charArr.join('') + (fullOrPartial ? ' full' : ' partial') + ' three-harmony ' + group.element + ' frame'
          });
        }
      }

      // --- 地支六冲 Branch Six Clashes ---
      var clashPairs = [
        ['子', '午'], ['丑', '未'], ['寅', '申'],
        ['卯', '酉'], ['辰', '戌'], ['巳', '亥']
      ];
      for (var i3 = 0; i3 < keys.length; i3++) {
        for (var j3 = i3 + 1; j3 < keys.length; j3++) {
          var b1 = branches[keys[i3]];
          var b2 = branches[keys[j3]];
          if (!b1 || !b2) continue;
          for (var cp = 0; cp < clashPairs.length; cp++) {
            var cpair = clashPairs[cp];
            if ((b1 === cpair[0] && b2 === cpair[1]) || (b1 === cpair[1] && b2 === cpair[0])) {
              results.push({
                type: 'branch_clash',
                typeZh: '地支六冲',
                typeEn: 'Branch Six Clash',
                positions: [keys[i3], keys[j3]],
                chars: [b1, b2],
                descZh: pillarLabelsZh[keys[i3]] + '支' + b1 + '与' + pillarLabelsZh[keys[j3]] + '支' + b2 + '相冲',
                descEn: pillarLabelsEn[keys[i3]] + ' branch ' + b1 + ' clashes with ' + pillarLabelsEn[keys[j3]] + ' branch ' + b2
              });
            }
          }
        }
      }

      // --- 地支三刑 Branch Three Punishments ---
      var xingRules = [
        { group: ['寅', '巳', '申'], zh: '恃势之刑', en: 'Punishment of power reliance' },
        { group: ['丑', '戌', '未'], zh: '无恩之刑', en: 'Punishment of ingratitude' },
        { group: ['子', '卯'], zh: '无礼之刑', en: 'Punishment of incivility' }
      ];
      for (var xr = 0; xr < xingRules.length; xr++) {
        var rule = xingRules[xr];
        var xMatched = [];
        for (var xb = 0; xb < branchArr.length; xb++) {
          if (rule.group.indexOf(branchArr[xb].branch) >= 0) {
            xMatched.push(branchArr[xb]);
          }
        }
        if (xMatched.length >= 2) {
          var xPos = [];
          var xChars = [];
          for (var xm = 0; xm < xMatched.length; xm++) {
            xPos.push(xMatched[xm].key);
            xChars.push(xMatched[xm].branch);
          }
          results.push({
            type: 'branch_punishment',
            typeZh: '地支三刑',
            typeEn: 'Branch Punishment',
            positions: xPos,
            chars: xChars,
            descZh: xChars.join('') + '——' + rule.zh,
            descEn: xChars.join('') + ' — ' + rule.en
          });
        }
      }
      // Self-punishment (辰辰, 午午, 酉酉, 亥亥)
      var selfPunishBranches = ['辰', '午', '酉', '亥'];
      for (var sp = 0; sp < selfPunishBranches.length; sp++) {
        var spBranch = selfPunishBranches[sp];
        var spHits = [];
        for (var sb = 0; sb < branchArr.length; sb++) {
          if (branchArr[sb].branch === spBranch) spHits.push(branchArr[sb]);
        }
        if (spHits.length >= 2) {
          var spPos = [];
          for (var sh = 0; sh < spHits.length; sh++) spPos.push(spHits[sh].key);
          results.push({
            type: 'branch_punishment',
            typeZh: '地支自刑',
            typeEn: 'Branch Self-Punishment',
            positions: spPos,
            chars: [spBranch, spBranch],
            descZh: spBranch + spBranch + '——自刑',
            descEn: spBranch + spBranch + ' — self-punishment'
          });
        }
      }

      // --- 地支六害 Branch Six Harms ---
      var harmPairs = [
        ['子', '未'], ['丑', '午'], ['寅', '巳'],
        ['卯', '辰'], ['申', '亥'], ['酉', '戌']
      ];
      for (var i4 = 0; i4 < keys.length; i4++) {
        for (var j4 = i4 + 1; j4 < keys.length; j4++) {
          var h1 = branches[keys[i4]];
          var h2 = branches[keys[j4]];
          if (!h1 || !h2) continue;
          for (var hp = 0; hp < harmPairs.length; hp++) {
            var hpair = harmPairs[hp];
            if ((h1 === hpair[0] && h2 === hpair[1]) || (h1 === hpair[1] && h2 === hpair[0])) {
              results.push({
                type: 'branch_harm',
                typeZh: '地支六害',
                typeEn: 'Branch Six Harm',
                positions: [keys[i4], keys[j4]],
                chars: [h1, h2],
                descZh: pillarLabelsZh[keys[i4]] + '支' + h1 + '与' + pillarLabelsZh[keys[j4]] + '支' + h2 + '相害',
                descEn: pillarLabelsEn[keys[i4]] + ' branch ' + h1 + ' harms ' + pillarLabelsEn[keys[j4]] + ' branch ' + h2
              });
            }
          }
        }
      }

      return results;
    }

    // =====================================================================
    // 7. Classical Text References (BAZI_CLASSICAL_REFS)
    // =====================================================================
    var BAZI_CLASSICAL_REFS = {
      '比肩': {
        zh: '《滴天髓》："天干一气，名为比肩，同我者助我，势众则争。"比肩旺则自主刚毅，过则独断争财。',
        en: 'Di Tian Sui: "When the heavenly stem shares the same qi, it is called Companion. Those alike support me, but in excess they compete." Strong Bi Jian brings independence and resolve; in excess, stubbornness and rivalry over resources.'
      },
      '劫财': {
        zh: '《子平真诠》："劫财如手足之争，同根而异利。"劫财旺则魄力大、敢冒险，过则破耗、与人争端。',
        en: 'Zi Ping Zhen Quan: "Rob Wealth is like siblings contending-same root, different interests." Strong Jie Cai brings boldness and daring; in excess, it drains wealth and breeds conflict.'
      },
      '食神': {
        zh: '《三命通会》："食神者，我生之神也，温和而有寿，能制七杀。"食神旺则才华横溢、气度从容。',
        en: 'San Ming Tong Hui: "The Eating God is what I give birth to-gentle and long-lived, able to restrain the Seven Killings." A strong Eating God signifies abundant talent and a composed demeanor.'
      },
      '伤官': {
        zh: '《滴天髓》："伤官见官，为祸百端。"伤官旺则聪明反叛、创意非凡，过则招灾伤名。',
        en: 'Di Tian Sui: "When Hurting Officer meets Direct Officer, a hundred troubles arise." Strong Hurting Officer brings brilliance and creativity; in excess, it courts disaster and damages reputation.'
      },
      '偏财': {
        zh: '《渊海子平》："偏财乃众人之财，非一人独享。"偏财旺则人缘广、财来路多，过则贪多嚼不烂。',
        en: 'Yuan Hai Zi Ping: "Indirect Wealth belongs to the crowd, not to one alone." Strong Indirect Wealth brings wide connections and diverse income; in excess, one grasps at too much.'
      },
      '正财': {
        zh: '《子平真诠》："正财者，我克之物也，辛勤可得。"正财旺则勤劳节俭、稳步积累。',
        en: 'Zi Ping Zhen Quan: "Direct Wealth is what I control through effort-earned by diligence." Strong Direct Wealth signifies hard work, frugality, and steady accumulation.'
      },
      '七杀': {
        zh: '《三命通会》："七杀如猛虎，有制则为将，无制则为灾。"七杀旺而有制则果敢权威，无制则凶暴。',
        en: 'San Ming Tong Hui: "The Seven Killings is like a fierce tiger-controlled, it becomes a general; uncontrolled, a disaster." With restraint, it grants authority and decisiveness; without, danger and aggression.'
      },
      '正官': {
        zh: '《滴天髓》："正官者，管我之神也。官星清纯，仕途可期。"正官旺则正直守规、名位可得。',
        en: 'Di Tian Sui: "The Direct Officer governs me. When the Officer star is pure and clear, an official career is attainable." Strong Direct Officer signifies integrity, discipline, and social standing.'
      },
      '偏印': {
        zh: '《渊海子平》："偏印又名枭神，夺食之星。"偏印旺则思维独特、悟性高，过则孤僻夺福。',
        en: 'Yuan Hai Zi Ping: "Indirect Seal, also called the Owl Spirit, is the star that seizes sustenance." Strong Indirect Seal brings unique thinking and high intuition; in excess, isolation and seized blessings.'
      },
      '正印': {
        zh: '《子平真诠》："印绶者，生我之神也。印旺则学业有成、贵人扶持。"正印旺则仁厚聪慧、学有所成。',
        en: 'Zi Ping Zhen Quan: "The Seal is what gives birth to me. When the Seal is strong, academic achievement follows and benefactors appear." Strong Direct Seal signifies benevolence, wisdom, and scholarly success.'
      }
    };

    // =====================================================================
    // 8. Comprehensive Natal Analysis Renderer
    // =====================================================================
    function renderFullNatalAnalysis(pillars, gender) {
      var zh = (typeof currentLocale !== 'undefined') ? currentLocale === 'zh' : false;
      var html = '';

      var esc = (typeof escapeHtml === 'function') ? escapeHtml : function(s) { return s; };

      var dm = pillars.d.charAt(0);
      var dmInfoObj = stemInfo[dm];
      if (!dmInfoObj) return '<p>Invalid pillars</p>';

      // ---- Section 1: Four Pillars Table ----
      html += '<div class="bazi-full-analysis" style="font-family:\'Space Grotesk\',\'JetBrains Mono\',sans-serif;color:var(--text-color,#d0d8e8);line-height:1.6;">';
      html += '<h4 style="margin:0 0 8px;color:var(--highlight-color,#eef2ff);">' + (zh ? '四柱八字全盘分析' : 'Four Pillars Full Natal Analysis') + '</h4>';

      var pillarKeys = ['y', 'm', 'd', 'h'];
      var pillarNamesZh = ['年柱', '月柱', '日柱', '时柱'];
      var pillarNamesEn = ['Year', 'Month', 'Day', 'Hour'];
      html += '<table style="border-collapse:collapse;width:100%;margin:8px 0;text-align:center;">';
      // Header
      html += '<tr>';
      for (var p = 0; p < 4; p++) {
        html += '<th style="padding:4px 8px;border:1px solid rgba(255,255,255,0.12);font-size:12px;color:var(--secondary-color,#687689);">';
        html += (zh ? pillarNamesZh[p] : pillarNamesEn[p]) + '</th>';
      }
      html += '</tr>';
      // Stems row
      html += '<tr>';
      for (var p1 = 0; p1 < 4; p1++) {
        var gz1 = pillars[pillarKeys[p1]];
        var s1 = gz1 ? gz1.charAt(0) : '?';
        var sInfo1 = stemInfo[s1];
        var sCol1 = sInfo1 ? elementColor[sInfo1.element][sInfo1.yin ? 'yin' : 'yang'] : '#888';
        html += '<td style="padding:6px;border:1px solid rgba(255,255,255,0.12);font-size:18px;font-weight:600;color:' + sCol1 + ';">' + s1 + '</td>';
      }
      html += '</tr>';
      // Branches row
      html += '<tr>';
      for (var p2 = 0; p2 < 4; p2++) {
        var gz2 = pillars[pillarKeys[p2]];
        var b2c = gz2 ? gz2.charAt(1) : '?';
        var bInfo2 = branchInfo[b2c];
        var bCol2 = bInfo2 ? elementColor[bInfo2.element][bInfo2.yin ? 'yin' : 'yang'] : '#888';
        html += '<td style="padding:6px;border:1px solid rgba(255,255,255,0.12);font-size:18px;font-weight:600;color:' + bCol2 + ';">' + b2c + '</td>';
      }
      html += '</tr>';
      // Hidden stems row
      html += '<tr>';
      for (var p3 = 0; p3 < 4; p3++) {
        var gz3 = pillars[pillarKeys[p3]];
        var br3 = gz3 ? gz3.charAt(1) : '';
        var hidden3 = BRANCH_HIDDEN_STEMS[br3] || [];
        var hiddenHtml = '';
        for (var hh = 0; hh < hidden3.length; hh++) {
          var hInfo3 = stemInfo[hidden3[hh]];
          var hCol3 = hInfo3 ? elementColor[hInfo3.element][hInfo3.yin ? 'yin' : 'yang'] : '#888';
          hiddenHtml += '<span style="color:' + hCol3 + ';margin:0 1px;">' + hidden3[hh] + '</span>';
        }
        html += '<td style="padding:4px;border:1px solid rgba(255,255,255,0.12);font-size:13px;">' + (hiddenHtml || '—') + '</td>';
      }
      html += '</tr>';
      html += '<tr><td colspan="4" style="padding:2px;font-size:10px;color:var(--secondary-color,#687689);border:1px solid rgba(255,255,255,0.12);">' + (zh ? '藏干' : 'Hidden Stems') + '</td></tr>';
      // Ten Gods row
      html += '<tr>';
      for (var p4 = 0; p4 < 4; p4++) {
        var gz4 = pillars[pillarKeys[p4]];
        var s4 = gz4 ? gz4.charAt(0) : '?';
        var tg4 = baziTenGod(dm, s4, pillarKeys[p4] === 'd');
        html += '<td style="padding:4px;border:1px solid rgba(255,255,255,0.12);font-size:11px;color:var(--secondary-color,#687689);">';
        html += (zh ? tg4.zh : tg4.en) + '</td>';
      }
      html += '</tr>';
      html += '</table>';

      // ---- Section 2: Day Master Assessment ----
      var ys = baziYongshen(pillars, gender);
      if (ys) {
        html += '<div style="margin:12px 0;padding:8px 12px;background:rgba(255,255,255,0.04);border-radius:8px;border:1px solid rgba(255,255,255,0.08);">';
        html += '<h5 style="margin:0 0 6px;font-size:13px;color:var(--accent-color,#4d8fff);">';
        html += (zh ? '日主强弱与用神' : 'Day Master Strength & Yongshen') + '</h5>';

        var strengthBadge = ys.isStrong
          ? '<span style="color:#D4623C;font-weight:600;">' + (zh ? '身强' : 'STRONG') + '</span>'
          : '<span style="color:#4A8ED4;font-weight:600;">' + (zh ? '身弱' : 'WEAK') + '</span>';

        html += '<p style="margin:4px 0;font-size:12px;">';
        html += (zh ? '日主：' : 'Day Master: ');
        var dmCol = elementColor[ys.dayMasterElement][dmInfoObj.yin ? 'yin' : 'yang'];
        html += '<span style="color:' + dmCol + ';font-weight:600;">' + dm + '</span>';
        html += ' (' + (BAZI_ELEM_ZH[ys.dayMasterElement] || ys.dayMasterElement) + ') — ' + strengthBadge + '</p>';

        var ysCol = elementColor[ys.yongshen] ? elementColor[ys.yongshen].yang : '#888';
        var xsCol = elementColor[ys.xishen] ? elementColor[ys.xishen].yang : '#888';
        var jsCol = elementColor[ys.jishen] ? elementColor[ys.jishen].yang : '#888';

        html += '<p style="margin:4px 0;font-size:12px;">';
        html += (zh ? '用神：' : 'Yongshen: ') + '<span style="color:' + ysCol + ';font-weight:600;">' + (BAZI_ELEM_ZH[ys.yongshen] || ys.yongshen) + '</span>';
        html += ' &nbsp;|&nbsp; ' + (zh ? '喜神：' : 'Xishen: ') + '<span style="color:' + xsCol + ';font-weight:600;">' + (BAZI_ELEM_ZH[ys.xishen] || ys.xishen) + '</span>';
        html += ' &nbsp;|&nbsp; ' + (zh ? '忌神：' : 'Jishen: ') + '<span style="color:' + jsCol + ';font-weight:600;">' + (BAZI_ELEM_ZH[ys.jishen] || ys.jishen) + '</span>';
        html += '</p>';

        html += '<p style="margin:4px 0;font-size:11px;color:var(--secondary-color,#687689);">' + esc(ys.reasoning) + '</p>';
        html += '</div>';
      }

      // ---- Section 3: Five-Element Pie Chart ----
      var props = baziElementProportions(pillars);
      html += '<div style="margin:12px 0;padding:8px 12px;background:rgba(255,255,255,0.04);border-radius:8px;border:1px solid rgba(255,255,255,0.08);">';
      html += '<h5 style="margin:0 0 6px;font-size:13px;color:var(--accent-color,#4d8fff);">';
      html += (zh ? '五行比例' : 'Five-Element Proportions') + '</h5>';
      html += '<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">';
      html += '<div>' + baziElementPieChartSVG(props) + '</div>';
      html += '<div style="font-size:12px;">';
      for (var ei = 0; ei < BAZI_ELEM_ORDER.length; ei++) {
        var elKey = BAZI_ELEM_ORDER[ei];
        var elColor = elementColor[elKey] ? elementColor[elKey].yang : '#888';
        html += '<div style="margin:2px 0;">';
        html += '<span style="display:inline-block;width:10px;height:10px;background:' + elColor + ';border-radius:2px;margin-right:4px;vertical-align:middle;"></span>';
        html += '<span style="color:' + elColor + ';">' + (BAZI_ELEM_ZH[elKey] || elKey) + ' ' + elKey + '</span>: ' + props[elKey];
        html += '</div>';
      }
      html += '</div></div></div>';

      // ---- Section 4: Interactions (合冲刑害) ----
      var interactions = baziInteractions(pillars);
      html += '<div style="margin:12px 0;padding:8px 12px;background:rgba(255,255,255,0.04);border-radius:8px;border:1px solid rgba(255,255,255,0.08);">';
      html += '<h5 style="margin:0 0 6px;font-size:13px;color:var(--accent-color,#4d8fff);">';
      html += (zh ? '合冲刑害' : 'Combinations, Clashes, Punishments & Harms') + '</h5>';
      if (interactions.length === 0) {
        html += '<p style="font-size:12px;color:var(--secondary-color,#687689);">' + (zh ? '四柱之间未见显著合冲刑害。' : 'No significant interactions found among the four pillars.') + '</p>';
      } else {
        html += '<ul style="margin:4px 0;padding-left:16px;font-size:12px;">';
        for (var ix = 0; ix < interactions.length; ix++) {
          var inter = interactions[ix];
          var typeColor = '#687689';
          if (inter.type === 'branch_clash') typeColor = '#D4623C';
          else if (inter.type === 'branch_punishment') typeColor = '#C09A6A';
          else if (inter.type === 'branch_harm') typeColor = '#C4AA5A';
          else if (inter.type.indexOf('combine') >= 0 || inter.type.indexOf('liuhe') >= 0 || inter.type.indexOf('sanhe') >= 0) typeColor = '#5AAA6A';
          html += '<li style="margin:3px 0;"><span style="color:' + typeColor + ';font-weight:500;">';
          html += (zh ? inter.typeZh : inter.typeEn) + ':</span> ';
          html += esc(zh ? inter.descZh : inter.descEn) + '</li>';
        }
        html += '</ul>';
      }
      html += '</div>';

      // ---- Section 5: Shen Sha ----
      var shensha = baziShenShaForNatal(pillars);
      html += '<div style="margin:12px 0;padding:8px 12px;background:rgba(255,255,255,0.04);border-radius:8px;border:1px solid rgba(255,255,255,0.08);">';
      html += '<h5 style="margin:0 0 6px;font-size:13px;color:var(--accent-color,#4d8fff);">';
      html += (zh ? '神煞' : 'Shen Sha (Spirit Stars)') + '</h5>';
      if (shensha.length === 0) {
        html += '<p style="font-size:12px;color:var(--secondary-color,#687689);">—</p>';
      } else {
        html += '<ul style="margin:4px 0;padding-left:16px;font-size:12px;">';
        for (var ss = 0; ss < shensha.length; ss++) {
          var sha = shensha[ss];
          html += '<li style="margin:2px 0;">';
          html += '<strong>' + (zh ? sha.zh : sha.en) + '</strong>';
          html += ' — ' + (zh ? '地支 ' : 'branch ') + sha.branch;
          var shaPresent = false;
          for (var sk = 0; sk < pillarKeys.length; sk++) {
            var pBranch = pillars[pillarKeys[sk]].charAt(1);
            if (pBranch === sha.branch) { shaPresent = true; break; }
          }
          if (shaPresent) {
            html += ' <span style="color:#D4623C;font-weight:600;">(' + (zh ? '命中带此煞' : 'present in natal chart') + ')</span>';
          }
          html += '</li>';
        }
        html += '</ul>';
      }
      html += '</div>';

      // ---- Section 6: Yuan Tiangang Bone Weight ----
      var boneWeight = baziYuanTiangangWeight(pillars.y, pillars.m, pillars.d, pillars.h);
      html += '<div style="margin:12px 0;padding:8px 12px;background:rgba(255,255,255,0.04);border-radius:8px;border:1px solid rgba(255,255,255,0.08);">';
      html += '<h5 style="margin:0 0 6px;font-size:13px;color:var(--accent-color,#4d8fff);">';
      html += (zh ? '袁天罡称骨算命' : 'Yuan Tiangang Bone Weight') + '</h5>';
      html += '<p style="margin:4px 0;font-size:14px;font-weight:600;color:var(--highlight-color,#eef2ff);">';
      html += boneWeight.weightLiang + (zh ? ' 两 ' : ' liang ') + boneWeight.weightQian + (zh ? ' 钱' : ' qian');
      html += ' <span style="font-size:12px;font-weight:400;color:var(--secondary-color,#687689);">(' + boneWeight.totalWeight + ')</span></p>';
      html += '<p style="margin:4px 0;font-size:12px;">' + esc(zh ? boneWeight.fortuneZh : boneWeight.fortune) + '</p>';
      html += '</div>';

      // ---- Section 7: Classical References for present Ten Gods ----
      html += '<div style="margin:12px 0;padding:8px 12px;background:rgba(255,255,255,0.04);border-radius:8px;border:1px solid rgba(255,255,255,0.08);">';
      html += '<h5 style="margin:0 0 6px;font-size:13px;color:var(--accent-color,#4d8fff);">';
      html += (zh ? '经典引用' : 'Classical References') + '</h5>';

      var seenTenGods = {};
      for (var p5 = 0; p5 < 4; p5++) {
        var gz5 = pillars[pillarKeys[p5]];
        var s5 = gz5 ? gz5.charAt(0) : '';
        if (pillarKeys[p5] === 'd') continue;
        var tg5 = baziTenGod(dm, s5, false);
        if (tg5.zh !== '—' && !seenTenGods[tg5.zh]) {
          seenTenGods[tg5.zh] = tg5;
        }
      }
      var refCount = 0;
      for (var tgKey in seenTenGods) {
        if (!seenTenGods.hasOwnProperty(tgKey)) continue;
        var ref = BAZI_CLASSICAL_REFS[tgKey];
        if (ref) {
          html += '<div style="margin:6px 0;padding:6px 8px;background:rgba(255,255,255,0.03);border-radius:6px;border-left:3px solid var(--accent-color,#4d8fff);">';
          html += '<p style="margin:0;font-size:11px;font-weight:600;color:var(--highlight-color,#eef2ff);">';
          html += tgKey + ' / ' + seenTenGods[tgKey].en + '</p>';
          html += '<p style="margin:3px 0 0;font-size:11px;color:var(--secondary-color,#687689);">' + esc(zh ? ref.zh : ref.en) + '</p>';
          html += '</div>';
          refCount++;
        }
      }
      if (refCount === 0) {
        html += '<p style="font-size:12px;color:var(--secondary-color,#687689);">' + (zh ? '暂无匹配经典引用。' : 'No matching classical references.') + '</p>';
      }
      html += '</div>';

      // Disclaimer
      html += '<p style="margin:10px 0 0;font-size:10px;color:var(--secondary-color,#687689);font-style:italic;">';
      html += (zh
        ? '注：以上为客户端原型推演，仅供参考，重大决策宜结合专业师承与多源验证。'
        : 'Note: This is a prototype client-side analysis for reference only. Major decisions deserve professional review.');
      html += '</p>';

      html += '</div>';
      return html;
    }
