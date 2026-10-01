import React from "react";
import { Container, Row, Col, ListGroup, Table } from "react-bootstrap";
import styled from "styled-components";

const StyledContainer = styled(Container)`
  margin-top: 40px;
`;

const AboutPage = () => {
  return (
    <StyledContainer>
      <Row>
        <Col md={12}>
          <h3>
            GOT SKILLS Application is for Instructors giving Extra Lessons to
            students.
          </h3>
          <p>
            GOT SKILLS application is built using the following frameworks and
            database :
          </p>
          <Table
            variant="transparent"
            className={`table ${
              localStorage.getItem("userTheme") === "dark" ? "text-light" : ""
            }`}
          >
            <thead>
              <tr>
                <th>Framework</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>React</td>
                <td>Frontend</td>
              </tr>
              <tr>
                <td>Nodejs</td>
                <td>Backend Restful API’s</td>
              </tr>
              <tr>
                <td>Mongodb</td>
                <td>Database</td>
              </tr>
            </tbody>
          </Table>
          <div className="container">
            <p>
              The app is designed to track courses, students, enrollments, and
              payments for instructors. Users of the app will fall into one of
              three categories: Admin, Instructor, and Student.
            </p>

            <p>The following are the specifications for the app:</p>
            <ul>
              <li>
                <strong>Authentication and Authorization:</strong> The app will
                have three types of users: Admin, Instructor, and Student. Only
                Admin users will be able to register new users. The app will
                authenticate users based on their user type and the credentials
                they provide. Admin users will have access to all
                functionalities of the app. Instructor users will only be able
                to view their courses, students, and enrollments. Student users
                will be able to view their courses, student record, enrollments,
                and payments, and make payments.
              </li>
              <li>
                <strong>Products Collection:</strong> The Products collection
                will contain information about the products offered in the app,
                such as the product code, name, instructor, number in stock,
                start and end dates, product price, and active status.
              </li>
              <li>
                <strong>Instructors Collection:</strong> The Instructors
                collection will contain information about the instructors, such
                as their name, email, phone, address, and active status.
              </li>
              <li>
                <strong>Customers Collection:</strong> The Customers collection
                will contain information about the students, such as their name,
                grade, email, phone, address, guardian name, guardian contact,
                and active status.
              </li>
              <li>
                <strong>Enrollments Collection:</strong> The Enrollments
                collection will contain information about the enrollments, such
                as the customer ID, product ID, enrollment date, completion
                date, grade, status, and payment status. Enrollment status can
                be Active, Inactive, Completed, Withdrawn, Failed, or Pending.
              </li>
              <li>
                <strong>Payments Collection:</strong> The Payments collection
                will contain information about the payments, such as the
                enrollment ID, amount, date, full payment status, transaction
                ID, payment method, and service provider.
              </li>
              <li>
                <strong>User Interface and User Experience:</strong> The app
                will have a user-friendly interface that is easy to navigate and
                use. Users will be able to search and filter the data in the app
                to find what they need quickly and easily. The app will generate
                payment requests with links to Payfast payment gateway for easy
                payment by students.
              </li>
              <li>
                <strong>Validation:</strong> The app will validate the data
                entered by users, such as ensuring that the course start and end
                dates are valid, and that the enrollment status is one of the
                valid options.
              </li>
              <li>
                <strong>Functionality:</strong> Admin users will be able to add,
                delete, and edit Instructors, Customers, Enrollments, and
                Payments. Instructor users will be able to view their courses,
                students, and enrollments. Student users will be able to view
                their courses, student record, enrollments, and payments, and
                make payments. The app will prevent students from enrolling in a
                course after it has already started or has ended. Similarly,
                instructors will be prevented from updating grades for a course
                that has already ended.
              </li>
            </ul>
          </div>

          <p>
            Register, login, start adding course products, look around and start
            to imagine what is possible.
          </p>
          <hr />
          <p>
            Hit these API endpoints to get the backend responses and see the
            results. Imagine what is possible!
          </p>

          <Table
            className={`table ${
              localStorage.getItem("userTheme") === "dark" ? "text-light" : ""
            }`}
          >
            <thead>
              <tr>
                <th scope="col">End-Point</th>
                <th scope="col">URL</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Students(Customers)</td>
                <td>
                  <a
                    href="http://178.62.84.58:5005/api/customers"
                    target="_blank"
                    rel="noreferrer"
                  >
                    http://178.62.84.58:5005/api/customers
                  </a>
                </td>
              </tr>
              <tr>
                <td>Tutors</td>
                <td>
                  <a
                    href="http://178.62.84.58:5005/api/instructors"
                    target="_blank"
                    rel="noreferrer"
                  >
                    http://178.62.84.58:5005/api/instructors
                  </a>
                </td>
              </tr>
              <tr>
                <td>Course/Lessons</td>
                <td>
                  <a
                    href="http://178.62.84.58:5005/api/products"
                    target="_blank"
                    rel="noreferrer"
                  >
                    http://178.62.84.58:5005/api/products
                  </a>
                </td>
              </tr>
              <tr>
                <td>Enrollments</td>
                <td>
                  <a
                    href="http://178.62.84.58:5005/api/enrollments"
                    target="_blank"
                    rel="noreferrer"
                  >
                    http://178.62.84.58:5005/api/enrollments
                  </a>
                </td>
              </tr>
            </tbody>
          </Table>
          <hr />

          <h4>Key Features</h4>
          <ListGroup className="bg-info text-dark font-weight-normal">
            <ListGroup.Item>
              Each application running in a Docker Container, built to scale.
            </ListGroup.Item>
            <ListGroup.Item>User Registration and Login</ListGroup.Item>
            <ListGroup.Item>
              JWT tokens used for authorisation and authentication
            </ListGroup.Item>
            <ListGroup.Item>
              Menu protection if not logged in or admin
            </ListGroup.Item>
            <ListGroup.Item>
              Screens, menus & table content builds dynamically as content is
              added
            </ListGroup.Item>
            <ListGroup.Item>
              Input validation is done on the frontend as well as data
              validation done on the API
            </ListGroup.Item>
            <ListGroup.Item>Errors are logged on all systems</ListGroup.Item>
          </ListGroup>
          <hr />
          <h4>Future Features</h4>
          <ListGroup className="bg-info text-dark font-weight-normal">
            <ListGroup.Item>Payment gateway integration</ListGroup.Item>
            <ListGroup.Item>Graphic Uploads for products/movies</ListGroup.Item>
            <ListGroup.Item>Dynamic Menu building</ListGroup.Item>

            <ListGroup.Item>Stay tunned for more ..</ListGroup.Item>
          </ListGroup>
        </Col>
      </Row>
    </StyledContainer>
  );
};

export default AboutPage;
