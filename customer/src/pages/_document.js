import SettingServices from "@services/SettingServices";
import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    const locale = ctx.locale;

    // Fetch general metadata from backend API with error handling
    let setting = null;
    try {
      setting = await SettingServices.getStoreSeoSetting();
    } catch (error) {
      console.warn("Failed to fetch store settings during build:", error.message);
      // Provide fallback values for build time
      setting = {
        favicon: "/favicon.png",
        meta_title: "SAPT Markets - React Grocery & Organic Food Store e-commerce Template",
        meta_description: "React Grocery & Organic Food Store e-commerce Template",
        meta_keywords: "ecommerce online store",
        meta_url: "https://saptmarkets-store.vercel.app/",
        meta_img: ""
      };
    }

    return { ...initialProps, setting, locale };
  }

  render() {
    const setting = this.props.setting;
    const { locale } = this.props;
    return (
      <Html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
        <Head>
          <link rel="icon" href={setting?.favicon || "/favicon.png"} />
          <link
            rel="stylesheet"
            href="/saudi-riyal-font.css"
          />
          <meta
            property="og:title"
            content={
              setting?.meta_title ||
              "SAPT Markets - React Grocery & Organic Food Store e-commerce Template"
            }
          />
          <meta property="og:type" content="eCommerce Website" />
          <meta
            property="og:description"
            content={
              setting?.meta_description ||
              "React Grocery & Organic Food Store e-commerce Template"
            }
          />
          <meta
            name="keywords"
            content={setting?.meta_keywords || "ecommenrce online store"}
          />
          <meta
            property="og:url"
            content={
              setting?.meta_url || "https://saptmarkets-store.vercel.app/"
            }
          />
          <meta
            property="og:image"
            content={
              setting?.meta_img ||
              ""
            }
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
