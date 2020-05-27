// var parser = require('./USFMparser.js')
const { Parser } = require('./parser.js');
// const json = require('json')
class JSONParser extends Parser {
  constructor(JSONObject) {
    super();
    this.JSONObject = JSONObject;
    this.warnings = [];
    this.noNewLineMarkers = ['va', 'vp', 'qs', 'qac', 'litl', 'lik', 'lik1', 'lik2', 'lik3',
      'liv', 'liv1', 'liv2', 'liv3', 'th', 'th1', 'th2', 'th3', 'th4', 'th5',
      'thr', 'thr1', 'thr2', 'thr3', 'thr4', 'thr5', 'tc', 'tc1', 'tc2', 'tc3',
      'tc4', 'tc5', 'tcr', 'tcr1', 'tcr2', 'tcr3', 'tcr4', 'tcr5', 'f', 'fe',
      'fr', 'fq', 'fqa', 'fk', 'fl', 'fw', 'fp', 'fv', 'ft', 'fdc', 'fm', 'x',
      'xo', 'xk', 'xq', 'xt', 'xta', 'xop', 'xot', 'xnt', 'xdc', 'rq', 'add', 'bk',
      'dc', 'k', 'lit', 'nd', 'ord', 'pn', 'png', 'addpn', 'qt', 'sig', 'sls', 'tl',
      'wj', 'em', 'bd', 'it', 'bdit', 'no', 'sc', 'sup', 'fig', '+add', '+bk',
      '+dc', '+k', '+lit', '+nd', '+ord', '+pn', '+png', '+addpn', '+qt', '+sig',
      '+sls', '+tl', '+wj', '+em', '+bd', '+it', '+bdit', '+no', '+sc', '+sup', 'jmp',
    ];
  }

  validate() {
    try {
      this.toUSFM(this.JSONObject);
      return true;
    } catch (err) {
      return false;
    }
  }

  normalize() {
    this.warnings = [];
    const normJson = this.JSONObject;
    return normJson;
  }

  toUSFM() {
    let usfmText = '';
    const jsonObj = this.JSONObject;
    usfmText += '\\id ';
    usfmText += jsonObj.book.bookCode;
    if (Object.prototype.hasOwnProperty.call(jsonObj.book, 'description')) {
      usfmText += ` ${jsonObj.book.description}`;
    }

    if (Object.prototype.hasOwnProperty.call(jsonObj.book, 'meta')) {
      usfmText = this.processInnerElements(jsonObj.book.meta, usfmText);
    }

    for (let i = 0; i < jsonObj.chapters.length; i += 1) {
      usfmText += `\n\\c ${jsonObj.chapters[i].chapterNumber}`;
      for (let j = 0; j < jsonObj.chapters[i].contents.length; j += 1) {
        const key = Object.keys(jsonObj.chapters[i].contents[j])[0];
        if (key === 'verseNumber') {
          usfmText += `\n\\v ${jsonObj.chapters[i].contents[j].verseNumber} `;
          if (Object.prototype.hasOwnProperty.call(jsonObj.chapters[i].contents[j], 'contents')) {
            for (let k = 0; k < jsonObj.chapters[i].contents[j].contents.length; k += 1) {
              if (typeof jsonObj.chapters[i].contents[j].contents[k] === 'string') {
                usfmText += ` ${jsonObj.chapters[i].contents[j].contents[k]}`;
              } else {
                usfmText = this.processInnerElements(jsonObj.chapters[i].contents[j].contents[k],
                  usfmText);
              }
            }
          } else {
            usfmText += jsonObj.chapters[i].contents[j].verseText;
          }
        } else {
          usfmText = this.processInnerElements(jsonObj.chapters[i].contents[j], usfmText);
        }
      }
    }
    usfmText = usfmText.replace(/\s+\n/g, '\n');
    usfmText = usfmText.replace(/\s\s+/g, ' ');
    return usfmText;
  }


  processInnerElements(jsonObject, usfm) {
    let usfmText = usfm;
    if (typeof jsonObject === 'string') {
      usfmText += ` ${jsonObject}`;
    } else if (Array.isArray(jsonObject)) {
      for (let i = 0; i < jsonObject.length; i += 1) {
        usfmText = this.processInnerElements(jsonObject[i], usfmText);
      }
    } else {
      const key = Object.keys(jsonObject)[0];
      if (key === 'list') {
        for (let i = 0; i < jsonObject.list.length; i += 1) {
          usfmText = this.processInnerElements(jsonObject.list[i], usfmText);
        }
      } else if (key === 'table') {
        if (Object.prototype.hasOwnProperty.call(jsonObject.table, 'header')) {
          usfmText += '\n\\tr';
          for (let i = 0; i < jsonObject.table.header.length; i += 1) {
            const innerKey = Object.keys(jsonObject.table.header[i])[0];
            usfmText += ` \\${innerKey} ${jsonObject.table.header[i][innerKey]}`;
          }
        }
        for (let i = 0; i < jsonObject.table.rows.length; i += 1) {
          usfmText += '\n\\tr';
          for (let j = 0; j < jsonObject.table.rows[i].length; j += 1) {
            const innerKey = Object.keys(jsonObject.table.rows[i][j])[0];
            usfmText += ` \\${innerKey} ${jsonObject.table.rows[i][j][innerKey]}`;
          }
        }
      } else if (key === 'footnote') {
        const notes = jsonObject.footnote;
        const marker = jsonObject.closing;
        usfmText += marker.replace('*', '');
        for (let i = 0; i < notes.length; i += 1) {
          const innerKey = Object.keys(notes[i])[0];
          if (innerKey === 'caller') { usfmText += notes[i][innerKey]; } else { usfmText = this.processInnerElements(notes[i], usfmText); }
        }
        usfmText += marker;
      } else if (key === 'cross-ref') {
        const notes = jsonObject['cross-ref'];
        const marker = jsonObject.closing;
        if (marker !== '\\xt*') { usfmText += marker.replace('*', ''); }
        for (let i = 0; i < notes.length; i += 1) {
          if (typeof notes[i] === 'string') {
            usfmText += ` ${notes[i]}`;
          } else {
            const innerKey = Object.keys(notes[i])[0];
            if (innerKey === 'caller') { usfmText += notes[i][innerKey]; } else { usfmText = this.processInnerElements(notes[i], usfmText); }
          }
        }
        usfmText += marker;
      } else if (key === 'milestone') {
        usfmText += `\\${jsonObject.milestone}${jsonObject.delimter}`;
        if (Object.prototype.hasOwnProperty.call(jsonObject, 'attributes')) {
          usfmText += ' |';
          for (let i = 0; i < jsonObject.attributes.length; i += 1) {
            const attribName = Object.keys(jsonObject.attributes[i])[0];
            if (attribName === 'defaultAttribute') { usfmText += jsonObject.attributes[i].defaultAttribute; } else {
              usfmText += ` ${attribName}="${jsonObject.attributes[i][attribName]}"`;
            }
          }
        }
        usfmText += jsonObject.closing;
      } else {
        if (!this.noNewLineMarkers.includes(key)) { usfmText += '\n'; }
        usfmText += `\\${key} `;
        if (Array.isArray(jsonObject[key])) {
          usfmText = this.processInnerElements(jsonObject[key], usfmText);
        } else if (jsonObject[key] !== null) { usfmText += jsonObject[key]; }
        if (Object.prototype.hasOwnProperty.call(jsonObject, 'attributes')) {
          if (Array.isArray(jsonObject.attributes)) {
            usfmText += ' |';
            for (let i = 0; i < jsonObject.attributes.length; i += 1) {
              const attribName = Object.keys(jsonObject.attributes[i])[0];
              if (attribName === 'defaultAttribute') { usfmText += jsonObject.attributes[i].defaultAttribute; } else { usfmText += ` ${attribName}="${jsonObject.attributes[i][attribName]}"`; }
            }
          } else { usfmText += jsonObject.attributes; }
        }
        if (Object.prototype.hasOwnProperty.call(jsonObject, 'closing')) {
          usfmText += ` ${jsonObject.closing}`;
        }
      }
    }
    return usfmText;
  }

  toCSV() {
    const jsonOutput = this.JSONObject;
    const bookName = jsonOutput.book.bookCode;
    const { chapters } = jsonOutput;
    let csvWriter = 'Book, Chapter, Verse, Text\n';
    for (let i = 0; i < chapters.length; i += 1) {
      const cno = chapters[i].chapterNumber;
      for (let j = 0; j < chapters[i].contents.length; j += 1) {
        if (Object.prototype.hasOwnProperty.call(chapters[i].contents[j], 'verseNumber')) {
          const vno = chapters[i].contents[j].verseNumber;
          const text = chapters[i].contents[j].verseText;
          csvWriter += `"${bookName}","${cno}","${vno}","${text}"\n`;
        }
      }
    }
    return csvWriter;
  }

  toTSV() {
    const jsonOutput = this.JSONObject;
    const bookName = jsonOutput.book.bookCode;
    const { chapters } = jsonOutput;
    let csvWriter = 'Book\tChapter\tVerse\tText\n';
    for (let i = 0; i < chapters.length; i += 1) {
      const cno = chapters[i].chapterNumber;
      for (let j = 0; j < chapters[i].contents.length; j += 1) {
        if (Object.prototype.hasOwnProperty.call(chapters[i].contents[j], 'verseNumber')) {
          const vno = chapters[i].contents[j].verseNumber;
          const text = chapters[i].contents[j].verseText;
          csvWriter += `"${bookName}"\t"${cno}"\t"${vno}"\t"${text}"\n`;
        }
      }
    }
    return csvWriter;
  }
}


exports.JSONParser = JSONParser;
