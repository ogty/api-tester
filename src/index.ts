import { prompt } from "enquirer";
import { userInfo } from "os";
import { getEndpoint } from "./libs/getEndpoint";
import { makeEndpointsMarkdown } from "./libs/makeEndpointsMarkdown";
import { writeFileSync, readFileSync } from "fs";
import type { EndpointConfiguration, MarkdownType } from "@/types";

const { Form, MultiSelect } = require("enquirer");

const username = userInfo().username;
const command = process.argv[2];
const secondCommand = process.argv[3];
const settingsPath = `/Users/${username}/api-tester-settings.json`;

const red = "\x1b[31m";
const cyan = "\x1b[36m";
const gray = "\x1b[90m";
const green = "\x1b[32m";
const reset = "\x1b[0m";
const purple = "\x1b[35m";
const yellow = "\x1b[33m";

console.clear();

if (command === "init") {
  try {
    (async () => {
      const api: any = await prompt([
        {
          type: "snippet",
          name: "result",
          message: "Please enter information about your API project.",
          required: true,
          template: `
  ${yellow}{${reset}
    ${gray}"${yellow}username${gray}": ${green}"${username}"${gray},
    ${gray}"${yellow}project${gray}": ${green}"/Users/${username}/\${project}${green}"${gray},
    ${gray}"${yellow}apiTarget${gray}": ${green}"/Users/${username}/\${project}/\${apiTarget}${green}/**/*.ts"${gray},
    ${gray}"${yellow}origin${gray}": ${green}"\${origin}${green}"
    ${gray}"${yellow}outputFileName${gray}": ${green}"\${outputFileName:endpoints.md}${green}"
  ${yellow}}${reset}
    `,
        },
      ]);

      const command: any = await prompt({
        type: "select",
        name: "command",
        message: "Please select the command of the API call you want to use",
        choices: ["curl", "http"],
      });

      const { project, apiTarget, origin, outputFileName } = api.result.values;
      const originWithoutSlash = origin.endsWith("/")
        ? origin.slice(0, -1)
        : origin;
      const markdownCodeSnippetWidth = 73;
      const markdownListTypeWidth = 65;
      const markdownBorderWidth = 73;
      const paddingForCode = " ".repeat(
        markdownCodeSnippetWidth -
          (command.command.length + originWithoutSlash.length + 1)
      );
      const paddingForListTypeOne = " ".repeat(
        markdownListTypeWidth - (originWithoutSlash.length + 1)
      );
      const paddingForListTypeTwo = " ".repeat(
        markdownListTypeWidth - 8 - (originWithoutSlash.length + 1)
      );
      const paddingForBorder = "─".repeat(
        markdownBorderWidth - 4 - (outputFileName.length + 1)
      );
      const paddingForBorderLong = "─".repeat(
        markdownBorderWidth - 16 - (outputFileName.length + 1)
      );

      const markdown: any = await prompt({
        type: "select",
        name: "markdown",
        message: `
    Please select the markdown format for output

    ╭─ ${outputFileName} - List Type ${paddingForBorder}╮
    │                                                                                   │
    │  ${cyan}- ${gray}[${green}users${gray}](${cyan}${originWithoutSlash}/users${gray})${reset}${paddingForListTypeOne}│
    │  ${cyan}- ${gray}[${green}users/:id${gray}](${cyan}${originWithoutSlash}/users/:id${gray})${reset}${paddingForListTypeTwo}│
    │  ${cyan}- ${gray}[${green}posts${gray}](${cyan}${originWithoutSlash}/posts${gray})${reset}${paddingForListTypeOne}│
    │  ...                                                                              │
    │                                                                                   │
    ╰───────────────────────────────────────────────────────────────────────────────────╯

    ╭─ ${outputFileName} - Code Type ${paddingForBorder}╮
    │                                                                                   │
    │  ${red}**${purple}\`users\`${red}**${reset}                                                                      │
    │                                                                                   │
    │  ${purple}\`\`\`zsh${reset}                                                                           │
    │  ${purple}$ ${command.command} ${originWithoutSlash}/users${paddingForCode}${reset}│
    │  ${purple}\`\`\`${reset}                                                                              │
    │  ...                                                                              │
    │                                                                                   │
    ╰───────────────────────────────────────────────────────────────────────────────────╯

    ╭─ ${outputFileName} - Code With Result Type ${paddingForBorderLong}╮
    │                                                                                   │
    │  ${red}**${purple}\`users\`${red}**${reset}                                                                      │
    │                                                                                   │
    │  ${purple}\`\`\`zsh${reset}                                                                           │
    │  ${purple}$ ${command.command} ${originWithoutSlash}/users${paddingForCode}${reset}│
    │  ${purple}\`\`\`${reset}                                                                              │
    │                                                                                   │
    │  ${cyan}<details>${reset}                                                                        │
    │    ${cyan}<summary>${reset}Response${cyan}</summary>${reset}                                                    │
    │                                                                                   │
    │  ${purple}\`\`\`json${reset}                                                                          │
    │  ${yellow}{}${reset}                                                                               │
    │  ${purple}\`\`\`${reset}                                                                              │
    │                                                                                   │
    │  ${cyan}</details>${reset}                                                                       │
    │  ...                                                                              │
    │                                                                                   │
    ╰───────────────────────────────────────────────────────────────────────────────────╯

    `,
        choices: ["list", "code", "code with result"] as MarkdownType[],
      });

      const savePath = await new Form({
        name: "savePath",
        message: "Please select the markdown output destination",
        choices: [
          {
            name: "path",
            message: "Markdown Output Destination",
            initial: `/Users/${username}/${project}`,
          },
        ],
      }).run();

      const result = {
        project,
        apiTarget,
        origin,
        commandType: command.command,
        markdownType: markdown.markdown,
        savePath: savePath.path,
        outputFileName,
        pathParameters: {},
      };

      writeFileSync(settingsPath, JSON.stringify(result, null, 4));
    })();
  } catch (error) {
    console.error(error);
  }
}

if (command === "setParams") {
  try {
    const file = readFileSync(settingsPath, "utf-8");
    const json = JSON.parse(file);
    const { project, apiTarget, origin } = json;

    const endpointConfiguration: EndpointConfiguration = {
      project,
      apiTarget,
      origin,
      username,
      pathParameters: {},
    };
    const endpoints = getEndpoint(endpointConfiguration);

    const pathParametersSet = endpoints
      .map((endpoint) => {
        const pathParams = endpoint.match(/:[a-zA-Z0-9]+$/g);
        return pathParams;
      })
      .filter((pathParams) => pathParams !== null)
      .flat()
      .filter((pathParam, index, self) => self.indexOf(pathParam) === index);

    const choices = pathParametersSet.map((pathParameter) => {
      return {
        name: pathParameter,
        message: pathParameter,
        initial: "",
      };
    });

    const prompt = new Form({
      name: "pathParameters",
      message: "Please provide the following information:",
      choices,
    });

    prompt
      .run()
      .then((value: any) => {
        json.pathParameters = value;
        writeFileSync(settingsPath, JSON.stringify(json, null, 4));
      })
      .catch(console.error);
  } catch (error) {
    console.error(error);
  }
}

if (command === "generate") {
  (async () => {
    try {
      const file = readFileSync(settingsPath, "utf-8");
      const json = JSON.parse(file);
      const {
        project,
        apiTarget,
        origin,
        pathParameters,
        savePath,
        outputFileName,
        markdownType,
        commandType,
      } = json;

      const endpointConfiguration: EndpointConfiguration = {
        project,
        apiTarget,
        origin,
        username,
        pathParameters,
      };

      let endpoints = getEndpoint(endpointConfiguration);
      if (secondCommand === "select") {
        const choices = endpoints.map((endpoint) => {
          return {
            name: endpoint,
            message: endpoint,
            initial: "",
          };
        });

        const prompt = await new MultiSelect({
          name: "value",
          message: "Please select the endpoint to call.",
          limit: endpoints.length,
          choices,
        }).run();
        endpoints = prompt;
      }

      const markdown = makeEndpointsMarkdown(
        endpoints,
        markdownType,
        commandType
      );

      markdown.then((data) => {
        writeFileSync(`${savePath}/${outputFileName}`, data);
      });
    } catch (error) {
      console.error(error);
    }
  })();
}

if (command === "help" || command === undefined) {
  console.log(`
  Commands:
    init: Initialize settings
    setParams: Set path parameters
    generate [select]: Generate markdown file
    help: Show help
  `);
}
