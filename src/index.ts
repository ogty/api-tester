#!/usr/bin/env node

import { prompt } from "enquirer";
import { userInfo } from "os";
import { getEndpoint } from "./libs/getEndpoint";
import { makeEndpointsMarkdown } from "./libs/makeEndpointsMarkdown";
import type { EndpointConfiguration } from "@/types";
import { writeFileSync, readFileSync } from "fs";

const { Form } = require("enquirer");

const username = userInfo().username;
const command = process.argv[2];

const red = "\x1b[31m";
const cyan = "\x1b[36m";
const gray = "\x1b[90m";
const green = "\x1b[32m";
const reset = "\x1b[0m";
const purple = "\x1b[35m";
const yellow = "\x1b[33m";

if (command === "init") {
  (async () => {
    console.clear();

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
    const markdownBorderWidth = 60;
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
    const paddingForBorder = "─".repeat(markdownBorderWidth - 4);
    const paddingForBorderLong = "─".repeat(markdownBorderWidth - 16);

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
      choices: ["list", "code", "code with result"],
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

    const filePath = `${__dirname}/data/settings.json`;
    writeFileSync(filePath, JSON.stringify(result, null, 4));
  })();
}

if (command === "setParams") {
  const filePath = `${__dirname}/data/settings.json`;
  const file = readFileSync(filePath, "utf-8");
  const json = JSON.parse(file);
  const { project, apiTarget, origin, pathParameters } = json;

  const endpointConfiguration: EndpointConfiguration = {
    project,
    apiTarget,
    origin,
    username: username,
    pathParameters: pathParameters,
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
      writeFileSync(filePath, JSON.stringify(json, null, 4));
    })
    .catch(console.error);
}

if (command === "generate") {
  const filePath = `${__dirname}/data/settings.json`;
  const file = readFileSync(filePath, "utf-8");
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
  const endpoints = getEndpoint(endpointConfiguration);
  const markdown = makeEndpointsMarkdown(endpoints, markdownType, commandType);

  markdown.then((data) => {
    writeFileSync(`${savePath}/${outputFileName}`, data);
  });
}

if (command === "help" || command === undefined) {
  console.log(`
  Commands:
    init: Initialize settings
    setParams: Set path parameters
    generate: Generate markdown file
    help: Show help
  `);
}
