describe('Clinic Appointment System - User Registration and Login', () => {
  beforeEach(() => {
    // Assuming the backend is running on localhost:3001
    cy.request('DELETE', 'http://localhost:3001/test/reset') // Optional: reset database
  })

  it('should allow user registration', () => {
    cy.registerUser('Cypress Test User', 'cypressuser@example.com', 'password123')

    // Should redirect to login page on success
    cy.url().should('include', 'login.html')

    // Check for success message
    cy.get('#message').should('contain', 'Registration successful')
  })

  it('should allow user login', () => {
    // First register
    cy.registerUser('Cypress Login User', 'cypresslogin@example.com', 'password123')

    // Then login
    cy.login('cypresslogin@example.com', 'password123')

    // Should redirect to dashboard
    cy.url().should('include', 'dashboard.html')

    // Check if user dashboard loads
    cy.contains('Welcome').should('be.visible')
  })

  it('should show error for invalid login', () => {
    cy.login('invalid@example.com', 'wrongpassword')

    // Should stay on login page
    cy.url().should('include', 'login.html')

    // Check for error message
    cy.get('#message').should('contain', 'Invalid credentials')
  })

  it('should allow doctor registration', () => {
    cy.registerDoctor('Dr. Cypress Test', 'cypressdoctor@example.com', 'password123', 'Cardiology')

    // Should redirect to login page on success
    cy.url().should('include', 'login.html')

    // Check for success message
    cy.get('#message').should('contain', 'Registration successful')
  })

  it('should allow doctor login', () => {
    // First register doctor
    cy.registerDoctor('Dr. Cypress Login', 'cypressdoclogin@example.com', 'password123', 'Neurology')

    // Then login
    cy.login('cypressdoclogin@example.com', 'password123')

    // Should redirect to doctor dashboard
    cy.url().should('include', 'doctor-dashboard.html')

    // Check if doctor dashboard loads
    cy.contains('Doctor Dashboard').should('be.visible')
  })
})