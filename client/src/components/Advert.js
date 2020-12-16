import React, { Component } from 'react';
import { withRouter, Link } from "react-router-dom";
import firebase from '../firebase';
import Item from './Item';

class Advert extends Component {

    constructor() {
        super();
        this.state = { 
            advert_info: null 
        }
    }

    componentDidMount() {
        const id = this.props.match.params.id;
        const db = firebase.firestore();
        db.collection('adverts')
            .doc(id)
            .onSnapshot(results => {
                var res = results.data();
                res["id"] = id;
                db.collection('users')
                    .doc(res.enterprise)
                    .get()
                    .then(results => {
                        let enterprise = results.data();
                        res["enterprise"] = enterprise.username;
                        this.setState({ advert_info: res });
                    });
            });
    }

    render() {

        return (
            <React.Fragment>
                {this.state.advert_info !== null && 
                    <section className="container">
                        <Link to="/">
                            <h3>
                                <i className="fa fa-arrow-left" /> {this.state.advert_info.title}
                            </h3>
                        </Link>
                        <Item 
                            advert_info={this.state.advert_info} 
                            user={this.props.user} 
                            user_details={this.props.user_details}
                        />
                    </section>
                }
            </React.Fragment>
        );
    }
}

export default withRouter(Advert);