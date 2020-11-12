/* 
    https://ui.dev/react-router-v4-query-strings/ 
    https://medium.com/@ericclemmons/react-event-preventdefault-78c28c950e46
*/

import React, { Component } from 'react';
import { Link, withRouter } from "react-router-dom";
import firebase from './firebase';
import { Formik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';

class Advert extends Component {

    constructor() {
        super();
        this.state = { advert_info: null }
    }

    componentDidMount() {
        var id = this.props.match.params.id;
        var db = firebase.firestore();
        db.collection('adverts').doc(id).onSnapshot(results => {
            var res = results.data();
            res["id"] = id;
            this.setState({ advert_info: res });
        });
    }

    render() {

        return (
            <div className="App">
                {this.state.advert_info !== null && <section className="container">
                    <a href="/#" className="menu-close" onClick={(e) => this.showAdvert(e, null)}><i className="fa fa-times"></i></a>
                   <div className="menu-intro">
                       <Link to={"/advert/" + this.state.advert_info.id}><h3>{this.state.advert_info.title}</h3></Link>
                       <p>{this.state.advert_info.enterprise} - {this.state.advert_info.location}</p>
                       {this.state.advert_info.contract.map(i => <p key={i}>{i}</p>)}
                   </div><hr />
                    <div className="menu-details">
                        {this.state.advert_info.introduction}
                        <ul>{this.state.advert_info.requirements.map(object => <li key={object}>{object}</li>)}</ul>
                        {this.state.advert_info.month_salary > 0 && <p><strong>Stipendio</strong>: {this.state.advert_info.month_salary} € / mese</p>}
                    </div>
                    <div className="menu-button">
                        <button className="insert" id="candidate" onClick={this.showMsgBox}>Candidati</button>
                    </div>
                </section>}
            </div>
        );
    }
}

export default withRouter(Advert);