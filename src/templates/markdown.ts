#!/usr/bin/env node

export const listTemplate = `- [{{ short endpoint }}]({{ endpoint }})`;

export const codeTemplate = `
**\`{{ short endpoint }}\`**

\`\`\`
curl {{ endpoint }}
\`\`\``;

export const codeTemplateWithResult = `
**\`{{ short endpoint }}\`**

\`\`\`
{{ command }} {{ endpoint }}
\`\`\`

<details>
    <summary>{{ summary title }}</summary>

\`\`\`json
{{ response }}
\`\`\`

</details>`;
