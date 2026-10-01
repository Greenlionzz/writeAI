import { Project, UserSettings, DailyStat } from '../types/writing';
import { defaultDemoProject } from '../data/defaultProject';

const STORAGE_PROJECTS_KEY = 'writeai_projects_v1';
const STORAGE_ACTIVE_PROJECT_ID = 'writeai_active_project_id';
const STORAGE_SETTINGS_KEY = 'writeai_user_settings_v1';

export const defaultSettings: UserSettings = {
  apiKey: '',
  selectedModel: 'gemini-3.8-flash',
  theme: 'dark',
  editorFontSize: 18,
  editorFontFamily: 'Newsreader',
  autoSaveIntervalMs: 2000,
  soundEffects: false,
  dailyWordGoal: 1000,
};

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (raw) {
      return { ...defaultSettings, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to load settings from storage', e);
  }
  return defaultSettings;
}

export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to storage', e);
  }
}

export function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_PROJECTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load projects from storage', e);
  }
  // Initialize with demo project
  const initial = [defaultDemoProject];
  saveProjects(initial);
  return initial;
}

export function saveProjects(projects: Project[]): void {
  try {
    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to save projects to storage', e);
  }
}

export function getActiveProjectId(projects: Project[]): string {
  try {
    const saved = localStorage.getItem(STORAGE_ACTIVE_PROJECT_ID);
    if (saved && projects.some((p) => p.id === saved)) {
      return saved;
    }
  } catch (e) {
    console.error('Failed to get active project ID', e);
  }
  return projects[0]?.id || '';
}

export function setActiveProjectId(id: string): void {
  try {
    localStorage.setItem(STORAGE_ACTIVE_PROJECT_ID, id);
  } catch (e) {
    console.error('Failed to set active project ID', e);
  }
}

export function recordWordCount(
  project: Project,
  wordsAddedDelta: number,
  sessionMinutes: number = 5
): Project {
  if (wordsAddedDelta === 0) return project;

  const today = new Date().toISOString().split('T')[0];
  const stats = [...(project.stats || [])];
  const existingIdx = stats.findIndex((s) => s.date === today);

  // Compute total project words
  let totalProjectWords = 0;
  project.books.forEach((b) => {
    b.acts.forEach((a) => {
      a.chapters.forEach((c) => {
        c.scenes.forEach((s) => {
          totalProjectWords += s.wordCount || 0;
        });
      });
    });
  });

  if (existingIdx >= 0) {
    stats[existingIdx] = {
      ...stats[existingIdx],
      wordsAdded: Math.max(0, stats[existingIdx].wordsAdded + wordsAddedDelta),
      totalWords: totalProjectWords,
      writingMinutes: stats[existingIdx].writingMinutes + sessionMinutes,
    };
  } else {
    stats.push({
      date: today,
      wordsAdded: Math.max(0, wordsAddedDelta),
      totalWords: totalProjectWords,
      writingMinutes: sessionMinutes,
    });
  }

  return {
    ...project,
    updatedAt: new Date().toISOString(),
    stats,
  };
}

// Export Project as JSON Backup
export function exportProjectJSON(project: Project): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_backup.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Export Project as Single Standalone HTML Reader Document
export function exportProjectHTML(project: Project): void {
  let manuscriptHtml = '';

  project.books.forEach((book, bIndex) => {
    manuscriptHtml += `<section class="book-title">
      <h1>${book.title}</h1>
      ${book.synopsis ? `<p class="book-synopsis">${book.synopsis}</p>` : ''}
    </section>`;

    book.acts.forEach((act) => {
      manuscriptHtml += `<section class="act-header">
        <h2>${act.title}</h2>
      </section>`;

      act.chapters.forEach((chapter) => {
        manuscriptHtml += `<section class="chapter-block">
          <h3>${chapter.title}</h3>`;

        chapter.scenes.forEach((scene) => {
          manuscriptHtml += `<article class="scene-block">
            <h4>${scene.title}</h4>
            <div class="scene-prose">
              ${scene.content
                .split('\n\n')
                .map((p) => `<p>${p.trim().replace(/\n/g, '<br/>')}</p>`)
                .join('')}
            </div>
          </article>`;
        });

        manuscriptHtml += `</section>`;
      });
    });
  });

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${project.title} - ${project.author}</title>
  <style>
    body {
      font-family: 'Newsreader', Georgia, 'Times New Roman', serif;
      background: #faf8f5;
      color: #1a1a1a;
      line-height: 1.8;
      font-size: 19px;
      margin: 0;
      padding: 3rem 1.5rem;
    }
    .container {
      max-width: 720px;
      margin: 0 auto;
      background: #ffffff;
      padding: 4rem 3.5rem;
      box-shadow: 0 4px 25px rgba(0,0,0,0.06);
      border-radius: 4px;
    }
    header.title-page {
      text-align: center;
      margin-bottom: 5rem;
      padding-bottom: 3rem;
      border-bottom: 2px solid #e5e0d8;
    }
    h1.project-title {
      font-size: 2.8rem;
      letter-spacing: -0.02em;
      margin: 0 0 0.5rem 0;
      font-weight: 700;
    }
    .author-name {
      font-size: 1.3rem;
      font-style: italic;
      color: #555;
    }
    .synopsis-box {
      margin-top: 2rem;
      font-size: 1.05rem;
      color: #666;
      font-style: italic;
    }
    .act-header h2 {
      font-size: 1.7rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      text-align: center;
      margin: 4rem 0 2rem 0;
      color: #444;
    }
    .chapter-block h3 {
      font-size: 1.5rem;
      margin: 3rem 0 1.5rem 0;
      border-bottom: 1px solid #eee;
      padding-bottom: 0.5rem;
    }
    .scene-block h4 {
      font-size: 1.1rem;
      font-style: italic;
      color: #777;
      margin-top: 2rem;
    }
    p {
      text-indent: 1.5em;
      margin: 0 0 0.5rem 0;
      text-align: justify;
    }
    p:first-of-type {
      text-indent: 0;
    }
    p:first-of-type::first-letter {
      font-size: 3.2rem;
      float: left;
      line-height: 0.8;
      padding-right: 0.15em;
      padding-top: 0.05em;
      font-weight: bold;
      color: #2b2b2b;
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="title-page">
      <h1 class="project-title">${project.title}</h1>
      ${project.subtitle ? `<p style="font-size:1.2rem; color:#666;">${project.subtitle}</p>` : ''}
      <p class="author-name">By ${project.author}</p>
      <div class="synopsis-box">${project.synopsis}</div>
    </header>
    <main>
      ${manuscriptHtml}
    </main>
  </div>
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_manuscript.html`;
  a.click();
  URL.revokeObjectURL(url);
}

// Export as EPUB Container (.epub file with container xml and chapter xhtml files)
export function exportProjectEPUB(project: Project): void {
  // Construct EPUB content package formatted as an XML/EPUB document
  let spineItems = '';
  let chapterSections = '';

  project.books.forEach((book) => {
    book.acts.forEach((act) => {
      act.chapters.forEach((chapter) => {
        chapter.scenes.forEach((scene, sIdx) => {
          const sceneId = `scene_${scene.id}`;
          spineItems += `<itemref idref="${sceneId}" />\n`;
          chapterSections += `
          <section id="${sceneId}" class="chapter-content">
            <h2>${chapter.title} - ${scene.title}</h2>
            ${scene.content
              .split('\n\n')
              .map((p) => `<p>${escapeXml(p.trim())}</p>`)
              .join('')}
          </section>`;
        });
      });
    });
  });

  const epubXml = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(project.title)}</dc:title>
    <dc:creator>${escapeXml(project.author)}</dc:creator>
    <dc:identifier id="BookId">urn:uuid:${project.id}</dc:identifier>
    <dc:language>en</dc:language>
    <dc:description>${escapeXml(project.synopsis)}</dc:description>
    <meta property="dcterms:modified">${new Date().toISOString()}</meta>
  </metadata>
  <manifest>
    <item id="content" href="content.xhtml" media-type="application/xhtml+xml" />
  </manifest>
  <spine>
    <itemref idref="content" />
  </spine>
</package>`;

  const fullEpubDoc = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en">
<head>
  <title>${escapeXml(project.title)}</title>
  <style>
    body { font-family: serif; line-height: 1.6; margin: 5%; }
    h1 { text-align: center; margin-bottom: 2em; }
    h2 { margin-top: 2em; border-bottom: 1px solid #ccc; }
    p { text-indent: 1.5em; margin: 0; }
    p:first-of-type { text-indent: 0; }
  </style>
</head>
<body>
  <h1>${escapeXml(project.title)}</h1>
  <p style="text-align:center; font-style:italic;">By ${escapeXml(project.author)}</p>
  ${chapterSections}
</body>
</html>`;

  // Create downloadable file package
  const blob = new Blob([fullEpubDoc], { type: 'application/epub+zip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.epub`;
  a.click();
  URL.revokeObjectURL(url);
}

// Export as ODT / Rich Text Format (.odt / .rtf)
export function exportProjectODT(project: Project): void {
  // Generate RTF compatible stream which LibreOffice, MS Word, and Apple Pages open natively as OpenDocument/RTF
  let rtfBody = `{\\rtf1\\ansi\\deff0\n`;
  rtfBody += `{\\fonttbl{\\f0\\froman Times New Roman;}{\\f1\\fswiss Arial;}}\n`;
  rtfBody += `{\\colortbl ;\\red0\\green0\\blue0;\\red128\\green128\\blue128;}\n`;

  rtfBody += `\\fs36\\b\\qc ${escapeRtf(project.title)}\\b0\\par\n`;
  if (project.subtitle) {
    rtfBody += `\\fs24\\i\\qc ${escapeRtf(project.subtitle)}\\i0\\par\n`;
  }
  rtfBody += `\\fs24\\qc By ${escapeRtf(project.author)}\\par\\par\n`;

  project.books.forEach((book) => {
    book.acts.forEach((act) => {
      rtfBody += `\\fs30\\b ${escapeRtf(act.title)}\\b0\\par\\par\n`;
      act.chapters.forEach((chapter) => {
        rtfBody += `\\fs26\\b ${escapeRtf(chapter.title)}\\b0\\par\n`;
        chapter.scenes.forEach((scene) => {
          rtfBody += `\\fs22\\i ${escapeRtf(scene.title)}\\i0\\par\\par\n`;
          scene.content.split('\n\n').forEach((para) => {
            rtfBody += `\\fs24\\ql ${escapeRtf(para.trim())}\\par\\par\n`;
          });
        });
      });
    });
  });

  rtfBody += `}`;

  const blob = new Blob([rtfBody], { type: 'application/rtf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.odt`;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

function escapeRtf(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/\n/g, '\\par ');
}
