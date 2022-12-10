import {
  listTemplate,
  codeTemplate,
  codeTemplateWithResult,
} from "../templates/markdown";
import { fetcher } from "../utils/fetcher";
import type { ApiCallCommand, MarkdownType } from "@/types";

export async function makeEndpointsMarkdown(
  endpoints: string[],
  markdownType: MarkdownType = "list",
  command: ApiCallCommand = "curl",
  maxDataLength = 5
) {
  const markdowns = endpoints.map(async (endpoint) => {
    const shortEndpoint = endpoint.split("/api")[1];

    let json: string;
    let isLarge = false;
    const response = await fetcher(endpoint);
    if (Array.isArray(response) && response.length > maxDataLength) {
      json = JSON.stringify(response.slice(0, maxDataLength), null, 4);
      isLarge = true;
    } else {
      json = JSON.stringify(response, null, 4);
    }

    const templates: { [key in MarkdownType]: string } = {
      "code with result": codeTemplateWithResult,
      code: codeTemplate,
      list: listTemplate,
    };
    const template = templates[markdownType];

    const markdown = template
      .replace(/{{ endpoint }}/g, endpoint)
      .replace(/{{ command }}/g, command)
      .replace(/{{ response }}/g, json)
      .replace(/{{ short endpoint }}/g, shortEndpoint)
      .replace(
        /{{ summary title }}/g,
        isLarge ? `Response (first ${maxDataLength} items)` : "Response"
      );
    return markdown;
  });

  return Promise.all(markdowns).then((markdowns) => {
    if (markdownType === "code with result") {
      return markdowns.join("\n\n---\n");
    }
    if (markdownType === "code") {
      return markdowns.join("\n");
    }
    return markdowns.join("\n");
  });
}
