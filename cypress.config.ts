{
  "e2e": {
    "baseUrl": "http://localhost:3001",
    "supportFile": "test/e2e/cypress/support/e2e.ts",
    "specPattern": "test/e2e/cypress/**/*.cy.{js,jsx,ts,tsx}",
    "video": false,
    "screenshotOnRunFailure": false
  },
  "component": {
    "devServer": {
      "framework": "create-react-app",
      "bundler": "webpack"
    }
  }
}