/* 
    https://ui.dev/react-router-v4-query-strings/ 
    https://medium.com/@ericclemmons/react-event-preventdefault-78c28c950e46
*/

import React, { Component } from 'react';
import { withRouter, Link } from "react-router-dom";
import firebase from './firebase';
import Item from './Item';

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
                    <Link to="/"><h3>{this.state.advert_info.title}</h3></Link>
                    <Item advert_info={this.state.advert_info} showAdvert={this.props.showAdvert} user={this.props.user} user_details={this.props.user_details}/>
                </section>}
            </div>
        );
    }
}

export default withRouter(Advert);