import { glob } from "glob";
import type { EndpointConfiguration } from "@/types";

const options = {
  nodir: true,
};

export function getEndpoint(conf: EndpointConfiguration): string[] {
  const { apiTarget, project, username, origin, pathParameters } = conf;

  const files = glob.sync(
    `/Users/${username}/${project}/${apiTarget}/**/*`,
    options
  );
  const endpoints: string[] = files.map((file) => {
    let endpoint = file
      .split(apiTarget)[1]
      .replace(/\.ts$/, "")
      .replace(/\/index$/, "")
      .replace(/\[(.+)\]/g, ":$1");

    if (pathParameters) {
      Object.keys(pathParameters).forEach((key) => {
        endpoint = endpoint.replace(key, pathParameters[key].toString());
      });
    }

    return `${origin}${endpoint}`;
  });

  return endpoints;
}
