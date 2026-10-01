import React from "react";
import { toast } from "react-toastify";

import Joi from "joi-browser";
import Form from "./common/form";

import { getCustomers } from "../services/customerService";
import { getMovies } from "../services/movieService";
import { getRental, saveRental } from "../services/rentalService";
import { returnCheckOut } from "../services/checkOutService";

class CheckOutForm extends Form {
  state = {
    data: {
      customerId: "",
      movieId: "",
      phone: "",
      dailyRentalRate: "",
      dateReturned: "",
      rentalFee: "",
    },
    customers: [],
    movies: [],
    errors: {},
  };

  // Validation using Joi for new checkOut
  schema = {
    _id: Joi.string(),
    customerId: Joi.string().required().label("Customer"),
    movieId: Joi.string().required().label("Movie"),
    title: Joi.string(),
    name: Joi.string(),
    dateOut: Joi.date().allow(null),
    dateReturned: Joi.date().allow(null),
    rentalFee: Joi.number(),
    dailyRentalRate: Joi.number()
      .integer()
      .required()
      .min(0)
      .max(10)
      .label("Daily Rental Rate"),
    phone: Joi.string()
      .min(7)
      .max(16)
      .regex(/^(\d{3}-\d{3}-\d{4}$)/, "Number format 999-999-9999 ")
      .required()
      .label("Phone"),
  };

  // called from componentDidMount
  async populateCustomers() {
    const { data: customers } = await getCustomers();

    this.setState({ customers });
  }

  // called from componentDidMount
  async populateMovies() {
    const { data: movies } = await getMovies();
    // DA 1 March 2023 added map to [name] for form and validation to work
    // DA 6 March 2023 added filter to exclude movies out of stock
    const updatedMovies = movies
      .filter((movie) => movie.numberInStock >= 1)
      .map((movie) => {
        return {
          ...movie,
          name: movie.title,
        };
      });

    this.setState({ movies: updatedMovies });
  }

  // called from componentDidMount
  async populateCheckOut() {
    try {
      const rentalId = this.props.match.params.id;
      if (rentalId === "new") return;

      const { data: rental } = await getRental(rentalId);

      this.setState({ data: this.mapToViewModel(rental) });
    } catch (ex) {
      switch (ex.response.status) {
        case 404:
          toast.error(ex.response.data);
          break;
        case 500:
          toast.error(ex.response.data);
          break;
        default:
          toast.error("CheckOutForm : Unspecified Error Occured");
      }
      this.props.history.replace("/not-found");
    }
  }

  async componentDidMount() {
    await this.populateCustomers();
    await this.populateMovies();
    await this.populateCheckOut();
  }

  componentDidUpdate(prevProps, prevState) {
    // Check if customerId has changed
    if (prevState.data.customerId !== this.state.data.customerId) {
      // Find the customer with the matching customerId
      const selectedCustomer = this.state.customers.find(
        (customer) => customer._id === this.state.data.customerId
      );

      // Set the phone number in the state
      this.setState({
        data: {
          ...this.state.data,
          phone: selectedCustomer.phone,
        },
      });
    }

    // DA 6 03 2023 Bug fix : Put check in place if movies is viewed before the return selected added && !this.state.data.dateOut.
    if (
      prevState.data.movieId !== this.state.data.movieId &&
      !this.state.data.dateOut
    ) {
      // Find the movie with the matching movieId
      const selectedMovie = this.state.movies.find(
        (movie) => movie._id === this.state.data.movieId
      );

      // Set the dailyRentalRate in the state
      this.setState({
        data: {
          ...this.state.data,
          dailyRentalRate: selectedMovie.dailyRentalRate,
        },
      });
    }
  }

  // You can remap data models from server to the display component
  mapToViewModel(rental) {
    // const rentalDays =
    //   (new Date() - new Date(rental.dateOut)) / (1000 * 60 * 60 * 24); // calculate rental duration in days
    // const rentalFee = Math.floor(rentalDays * rental.movie.dailyRentalRate); // calculate rental fee based on rental duration and daily rental rate
    // const dateReturned = new Date().toISOString(); // set the return date to today's date

    return {
      _id: rental._id,
      customerId: rental.customer._id,
      name: rental.customer.name,
      phone: rental.customer.phone,
      movieId: rental.movie._id,
      title: rental.movie.title,
      dailyRentalRate: rental.movie.dailyRentalRate,
      dateOut: rental.dateOut,
      dateReturned: rental.dateReturned,
    };
  }

  doReturn = async () => {
    try {
      const returnData = await returnCheckOut(
        this.state.data._id,
        this.state.data.customerId,
        this.state.data.movieId
      );

      this.setState({
        data: {
          ...this.state.data,
          dateReturned: returnData.data.dateReturned,
          rentalFee: returnData.data.rentalFee,
        },
      });

      //this.props.history.push("/rentals/");
    } catch (ex) {
      if (ex.response)
        switch (ex.response.status) {
          case 400:
            toast.error(ex.response.data);
            break;
          case 401:
            toast.error(ex.response.data);
            break;
          case 404:
            toast.error(ex.response.data);
            break;
          case 403:
            toast.error(ex.response.data);
            break;
          default:
            toast.error("A Unspecified Error occured.", ex.response.data);
        }
    }
  };

  doRental = async () => {
    // Call the server
    try {
      await saveRental(this.state.data.customerId, this.state.data.movieId);
      this.props.history.push("/rentals");
    } catch (ex) {
      if (ex.response)
        switch (ex.response.status) {
          case 400:
            toast.error(ex.response.data);
            break;
          case 401:
            toast.error(ex.response.data);
            break;
          case 404:
            toast.error(ex.response.data);
            break;
          case 403:
            toast.error(ex.response.data);
            break;
          default:
            toast.error("A Unspecified Error occured.", ex.response.data);
        }
    }
  };

  async doSubmit() {
    // if (!this.state.data.dateOut) {
    //   await this.doRental();
    //   return;
    // }
    await this.doReturn();
  }

  render() {
    return (
      //DA 5 March 2023 added conditional form for new and edit
      <div>
        <h1>Checkout Return</h1>
        <form onSubmit={this.handleSubmit}>
          <div className="row">
            <div className="col-md-6">
              {this.renderInputReadOnly("name", "Customer")}
              {this.renderInputReadOnly("phone", "Phone")}
              {this.renderInputReadOnly("title", "Movie")}
            </div>
            <div className="col-md-6">
              {this.renderInputReadOnly("dateOut", "Date Out")}
              {this.renderInputReadOnly("dailyRentalRate", "Daily Rate")}
              {this.renderInputReadOnly("dateReturned", "Date Returned")}
              {this.renderInputReadOnly("rentalFee", "Rental Fee")}
              <div className="text-right">
                {!this.state.data.dateReturned
                  ? this.renderReturnButton("Return")
                  : this.renderButton("Print")}
                {this.renderLink("/rentals/", "Exit")}
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }
}

export default CheckOutForm;
