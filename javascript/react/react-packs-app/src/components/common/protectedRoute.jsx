import React from "react";
import { Route, Redirect } from "react-router-dom";

import auth from "../../services/authService";

// DA 27 03 2023 : Added user in return Render to display Add buttons to displayed table contents (Students, Enrollments ... etc.)

const ProtectedRoute = ({
  path,
  component: Component,
  user,
  render,
  ...rest
}) => {
  return (
    <Route
      {...rest}
      render={(props) => {
        if (!auth.getCurrentUser())
          return (
            <Redirect
              to={{
                pathname: "/login",
                state: { from: props.location },
              }}
            />
          );
        return Component ? <Component {...props} user={user} /> : render(props);
      }}
    ></Route>
  );
};

export default ProtectedRoute;
