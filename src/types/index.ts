#!/usr/bin/env node

type PathParameters = {
  [key: string]: string | number;
};

export type EndpointConfiguration = {
  origin: string;
  apiTarget: string;
  project: string;
  username: string;
  pathParameters?: PathParameters;
};

export type ApiCallCommand = "curl" | "http";

export type MarkdownType = "code" | "list" | "code with result";
