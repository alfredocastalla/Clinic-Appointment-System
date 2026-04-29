// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/// <reference types="cypress" />

// Custom command to login
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login.html')
  cy.get('#email').type(email)
  cy.get('#password').type(password)
  cy.get('button[type="submit"]').click()
})

// Custom command to register user
Cypress.Commands.add('registerUser', (name: string, email: string, password: string) => {
  cy.visit('/register-user.html')
  cy.get('#name').type(name)
  cy.get('#email').type(email)
  cy.get('#password').type(password)
  cy.get('button[type="submit"]').click()
})

// Custom command to register doctor
Cypress.Commands.add('registerDoctor', (name: string, email: string, password: string, specialization: string) => {
  cy.visit('/register-doctor.html')
  cy.get('#name').type(name)
  cy.get('#email').type(email)
  cy.get('#password').type(password)
  cy.get('#specialization').type(specialization)
  cy.get('button[type="submit"]').click()
})

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      registerUser(name: string, email: string, password: string): Chainable<void>
      registerDoctor(name: string, email: string, password: string, specialization: string): Chainable<void>
    }
  }
}