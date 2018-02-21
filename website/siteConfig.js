/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* List of projects/orgs using your project for the users page */
const users = [
  // {
  //   caption: "User1",
  //   image: "/test-site/img/docusaurus.svg",
  //   infoLink: "https://www.facebook.com",
  //   pinned: true
  // }
];

const siteConfig = {
  title: "React Native DOM" /* title for your website */,
  tagline: "An experimental web target for React Native",
  url: "https://vincentriemer.com" /* your website url */,
  baseUrl: "/" /* base url for your project */,
  projectName: "react-native-dom",
  headerLinks: [
    { doc: "doc1", label: "Docs" },
    { page: "help", label: "Help" },
    { blog: true, label: "Blog" }
  ],
  users,
  /* path to images for header/footer */
  headerIcon: "img/rn-dom-logo.svg",
  footerIcon: "img/rn-dom-logo.svg",
  favicon: "img/rn-dom-logo-favicon.png",
  /* colors for website */
  colors: {
    primaryColor: "#20232A",
    secondaryColor: "#3A3249",
    backgroundColor: "#282C34",
    tintColor: "#D063FB",
    textInvert: "#FFFFFF"
  },
  // This copyright info is used in /core/Footer.js and blog rss/atom feeds.
  copyright: "Copyright © " + new Date().getFullYear() + " Vincent Riemer",
  organizationName: "vincentriemer", // or set an env variable ORGANIZATION_NAME
  projectName: "react-native-dom", // or set an env variable PROJECT_NAME
  highlight: {
    // Highlight.js theme to use for syntax highlighting in code blocks
    theme: "atom-one-dark"
  },
  scripts: ["https://buttons.github.io/buttons.js"],
  // You may provide arbitrary config keys to be used as needed by your template.
  repoUrl: "https://github.com/vincentriemer/react-native-dom",
  twitter: true
};

module.exports = siteConfig;
