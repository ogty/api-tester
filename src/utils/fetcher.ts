import axios from "axios";

export async function fetcher(endpoint: string) {
  const { data: json } = await axios.get(endpoint);
  return json;
}
