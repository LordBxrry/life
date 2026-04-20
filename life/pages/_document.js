// pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Life Application - Social platform with financial tracking" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
