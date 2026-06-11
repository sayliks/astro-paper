import { OG_FONT_FAMILY } from "./ogFont.ts";

const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;
const OG_IMAGE_CONTENT_TYPE = "image/png";

type OgStyleValue = string | number;
type OgStyle = Record<string, OgStyleValue>;

export type OgChild = string | OgNode | OgChild[];

export type OgNode = {
  type: string;
  key?: null;
  props: {
    style?: OgStyle;
    children?: OgChild;
  };
};

type OgFrameOptions = {
  body: OgChild;
  footer: OgChild;
};

export function createOgSatoriOptions<TFonts>(fonts: TFonts) {
  return {
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    embedFont: true,
    fonts,
  };
}

export function createOgImageResponse(pngData: Uint8Array): Response {
  return new Response(pngData as unknown as BodyInit, {
    headers: { "Content-Type": OG_IMAGE_CONTENT_TYPE },
  });
}

export function createOgText(children: OgChild, style: OgStyle): OgNode {
  return {
    type: "p",
    props: {
      style,
      children,
    },
  };
}

export function createOgSpan(children: OgChild, style?: OgStyle): OgNode {
  return {
    type: "span",
    props: style ? { style, children } : { children },
  };
}

export function createCenteredOgBody(children: OgChild): OgNode {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "90%",
        maxHeight: "90%",
        overflow: "hidden",
        textAlign: "center",
      },
      children,
    },
  };
}

export function createOgFooter(
  children: OgChild,
  justifyContent: "flex-end" | "space-between"
): OgNode {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        justifyContent,
        width: "100%",
        marginBottom: "8px",
        fontSize: 28,
      },
      children,
    },
  };
}

export function createOgImageFrame({ body, footer }: OgFrameOptions): OgNode {
  return {
    type: "div",
    key: null,
    props: {
      style: {
        background: "#fefbfb",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: OG_FONT_FAMILY,
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: "-1px",
              right: "-1px",
              border: "4px solid #000",
              background: "#ecebeb",
              opacity: "0.9",
              borderRadius: "4px",
              display: "flex",
              justifyContent: "center",
              margin: "2.5rem",
              width: "88%",
              height: "80%",
            },
          },
        },
        {
          type: "div",
          props: {
            style: {
              border: "4px solid #000",
              background: "#fefbfb",
              borderRadius: "4px",
              display: "flex",
              justifyContent: "center",
              margin: "2rem",
              width: "88%",
              height: "80%",
            },
            children: {
              type: "div",
              props: {
                style: {
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  margin: "20px",
                  width: "90%",
                  height: "90%",
                },
                children: [body, footer],
              },
            },
          },
        },
      ],
    },
  };
}
