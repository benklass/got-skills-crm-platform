import React from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";

function FooterNavbar() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="container">
      <hr />
      <div className="row disclaimer-text">
        <div className="col">
          <p
            className={`navbar-text text-secondary text-left ${
              localStorage.getItem("userTheme") === "dark" ? "text-light" : ""
            }`}
          >
            © {currentYear} DAC. All Rights Reserved.
          </p>
        </div>
        <div className="col-4 navbar-text text-right">
          <a
            href="mailto:178.62.84.58.7do1n@simplelogin.com"
            target="_blank"
            rel="noreferrer"
          >
            <FontAwesomeIcon
              icon={faEnvelope}
              className="text-secondary mr-2"
              size="2x"
            />
          </a>

          <a
            href="https://www.linkedin.com/in/david-abraham-za/"
            target="_blank"
            rel="noreferrer"
          >
            <i
              aria-hidden="true"
              className="fa fa-2x fa-linkedin-square text-secondary mr-2"
            ></i>
          </a>
          <a
            href="https://twitter.com/DaveaBTC"
            target="_blank"
            rel="noreferrer"
          >
            <i
              className="fa fa-2x fa-twitter-square text-secondary "
              aria-hidden="true"
            ></i>
          </a>
        </div>
      </div>
      <div className="row">
        <div className="col">
          <p
            className={`navbar-text text-left text-secondary ${
              localStorage.getItem("userTheme") === "dark" ? "text-light" : ""
            } disclaimer-text`}
          >
            IMPORTANT DISCLAIMER: All content provided herein the website,
            hyperlinked sites, associated applications, forums, blogs, social
            media accounts and other platforms (“Site”) is for your general
            information only. There are no warranties of any kind in relation to
            the content, including but not limited to accuracy and updatedness.
          </p>
        </div>
      </div>
    </div>
  );
}

export default FooterNavbar;
