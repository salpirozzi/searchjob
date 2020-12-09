import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch, withRouter } from 'react-router-dom';

import Home from './components/Home.js';
import Login from './components/Login.js';
import Register from './components/Register.js';
import Insert from './components/Insert.js';
import Advert from './components/Advert.js';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import firebase from './firebase';

import './App.css';

class App extends Component {

  constructor() {
    super();
    this.state = { 
      user: null, 
      user_details: [], 
      loaded: false 
    }
  }

  componentDidMount() {
    firebase.auth().onAuthStateChanged(async user => { 
        var data = [];

        if(user !== null) {
          var db = firebase.firestore();
          await db.collection('users').doc(user.uid).get().then(res => data = res.data());
        }

        this.setState({ user: user, user_details: data, loaded: true });
    })
  }

  render() {

    return (
      <Router>
        <div className="App">
          <ToastContainer position="top-right" autoClose={1500} hideProgressBar={true}/>
          <Switch>
            {this.state.loaded === true && 
              <React.Fragment>
                <Route exact path="/" component={() => <Home user={this.state.user} user_details={this.state.user_details}/>} />
                <Route exact path="/login" component={() => <Login user={this.state.user} user_details={this.state.user_details}/>} />
                <Route exact path="/register" component={() => <Register user={this.state.user} user_details={this.state.user_details}/>} />
                <Route exact path="/insert" component={() => <Insert user={this.state.user} user_details={this.state.user_details}/>} />
                <Route exact path="/advert/:id" component={() => <Advert user={this.state.user} user_details={this.state.user_details}/>} />
              </React.Fragment>
            }
          </Switch>
        </div>
      </Router>
    )
  }
}

export default withRouter(App);