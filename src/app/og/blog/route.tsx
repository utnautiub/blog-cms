/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";

import { SITE_URL, AUTHOR_IMAGE_URL, SITE_NAME } from "@/config/site";

export const runtime = "edge";

const montserratSemiBold = fetch(
  new URL("../Montserrat-SemiBold.ttf", import.meta.url),
).then((res) => res.arrayBuffer());

const montserratRegular = fetch(
  new URL("../Montserrat-Regular.ttf", import.meta.url),
).then((res) => res.arrayBuffer());

export async function GET(request: Request) {
  const montserratSemiBoldFont = await montserratSemiBold;
  const montserratRegularFont = await montserratRegular;

  try {
    const { searchParams } = new URL(request.url);

    // ?title=<title>
    const hasTitle = searchParams.has("title");
    const title = hasTitle
      ? searchParams.get("title")?.slice(0, 100)
      : "My default title";

    // ?top=<top>
    const hasTop = searchParams.has("top");
    const top = hasTop
      ? searchParams.get("top")?.slice(0, 100)
      : "My default top";

    const lg = {
      fontSize: "72px",
      lineHeight: "80px",
      fontWeight: 800,
      fontFamily: "SwitzerBold",
      color: "#f4f4f5",
    };

    const md = {
      fontSize: "62px",
      lineHeight: "70px",
      fontWeight: 900,
      fontFamily: "SwitzerBold",
      color: "#f4f4f5",
    };

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "#d4d4d8",
            background: "#18181b",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "space-between",
              width: "1200px",
              height: "630px",
              padding: "80px",
            }}
          >
            <p
              style={{
                fontFamily: "Montserrat Mono",
                fontSize: "28px",
                marginBottom: "25px",
              }}
            >
              {top}
            </p>

            <h1 style={title!.length < 60 ? lg : md}>{title}</h1>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <p
                style={{
                  fontFamily: "Montserrat Mono",
                  fontSize: "28px",
                }}
              >
                {new URL(SITE_URL).hostname}
              </p>
              {AUTHOR_IMAGE_URL && (
                <img
                  src={AUTHOR_IMAGE_URL}
                  alt={`${SITE_NAME}'s avatar`}
                  width={70}
                  height={70}
                  style={{
                    borderRadius: "100px",
                  }}
                />
              )}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Montserrat",
            data: montserratSemiBoldFont,
            style: "normal",
          },
          {
            name: "Montserrat Mono",
            data: montserratRegularFont,
            style: "normal",
          },
        ],
      },
    );
  } catch (e) {
    if (e instanceof Error) {
      console.log(`${e.message}`);
    } else {
      console.log("An unknown error occurred");
    }
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
