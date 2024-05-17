import * as htmlparser2 from "htmlparser2";
import { ElementType } from "htmlparser2";
import * as domutils from "domutils";
import { type Element } from "domhandler";
import { type Founding } from "./types";

/**
 * Parses the nation and region from the text of a founding
 *
 * @param text the text of a founding
 * @returns the nation and region of the founding, if any
 */
export function parseFoundingText(text: string) {
  const matches = text.match(
    /^@@(?<nation>.+)@@ was (re)?founded in %%(?<region>.+)%%\.$/,
  );
  return { nation: matches?.groups?.nation, region: matches?.groups?.region };
}

/**
 * Parses the foundings from an XML document
 *
 * @param document the XML document to parse foundings from
 * @returns the foundings in the document
 */
export function parseFoundings(document: string) {
  const dom = htmlparser2.parseDocument(document, { xmlMode: true });

  const eventElems = domutils.filter(
    (elem) => elem.type === ElementType.Tag && elem.name === "EVENT",
    dom,
  ) as Element[];

  const foundings: Founding[] = [];

  for (const eventElem of eventElems) {
    const timestampElem = eventElem.children.find(
      (elem) => elem.type === ElementType.Tag && elem.name === "TIMESTAMP",
    );
    const textElem = eventElem.children.find(
      (elem) => elem.type === ElementType.Tag && elem.name === "TEXT",
    );

    if (!timestampElem || !textElem) {
      continue;
    }

    const { nation, region } = parseFoundingText(
      domutils.textContent(textElem),
    );

    if (nation && region) {
      foundings.push({
        time: new Date(Number(domutils.textContent(timestampElem)) * 1000),
        nation,
        region,
      });
    }
  }

  return foundings;
}
