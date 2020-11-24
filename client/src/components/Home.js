/* 
    https://medium.com/@ericclemmons/react-event-preventdefault-78c28c950e46
*/

import React, { Component } from 'react';
import { Link, withRouter } from "react-router-dom";
import firebase from '../firebase';
import Item from './Item';

import { toast } from 'react-toastify';

class Home extends Component {

    constructor() {
        super();
        this.state = {
            adverts: [], 
            advert_info: null, 
            showed_adverts: [], 
            contract: null, 
            location: null, 
            date: null,
            page_adverts: [],
            total_pages: 1,
            current_page: 1,
            items_per_page: 2
        };
        this.filterbyDate = this.filterbyDate.bind(this);
        this.logOut = this.logOut.bind(this);
        this.showAdvert = this.showAdvert.bind(this);
    }

    logOut(e) {
        e.preventDefault();

        firebase.auth().signOut()
            .then(() => toast.success("Logout effettuato."))
            .catch(error => console.log(error));
    }

    componentDidMount() {
        var db = firebase.firestore();
        var date = new Date();
        var time = firebase.firestore.Timestamp.fromDate(date);
        db.collection('adverts').orderBy('date', 'desc').onSnapshot(results => {
            const data = results.docs.map(doc => {
                var res = doc.data();
                res["id"] = doc.id; 
                db.collection('users').doc(res.enterprise).get().then(results => {
                    var enterprise = results.data();
                    res["enterprise"] = enterprise.username;
                });
                return res;
            });
            var total_adverts = data.filter(obj => obj.expiry >= time);
            var number_page = Math.round(total_adverts.length / this.state.items_per_page);
            var adverts_to_show = total_adverts.slice(0, this.state.items_per_page);
            var advert_info_changed = null;
            if(this.state.advert_info !== null) {
                var index = adverts_to_show.map(e => e.id).indexOf(this.state.advert_info.id);
                if(index !== -1) advert_info_changed = adverts_to_show[index];
            }
            this.setState({ 
                adverts: total_adverts, 
                showed_adverts: adverts_to_show, 
                total_pages: (!number_page) ? 1 : number_page, 
                page_adverts: adverts_to_show,
                advert_info: advert_info_changed
            }, () => this.goPage(null, this.state.current_page));
        });
    }

    filterbyDate(i, selected_date) {
        var time;

        switch(selected_date) {
            case 'three_days': time = (1000 * 60 * 60 * 24) * 3; break;
            case 'seven_days': time = (1000 * 60 * 60 * 24) * 7; break;
            case 'fourteen_days': time = (1000 * 60 * 60 * 24) * 14; break;
            case 'last_month': time = (1000 * 60 * 60 * 24) * 30; break;
            default: time = (1000 * 60 * 60 * 24); break;
        } 

        var current_date = new Date();
        var current_time = current_date.getTime();
        var date = new Date(i.date.seconds * 1000);
        var date_time = date.getTime();
        return (current_time - date_time < time);
    }

    setFilter(e, contract, location, date) {
        var announces = this.state.showed_adverts;

        if(contract === "null") contract = null;
        if(location === "null") location = null;
        if(date === "null") date = null;

        if(contract !== null) announces = announces.filter(obj => obj.contract[0] === contract || obj.contract[1] === contract);
        if(location !== null) announces = announces.filter(obj => obj.location === location);
        if(date !== null) announces = announces.filter(i => this.filterbyDate(i, date));    
        
        this.setState({ 
            page_adverts: announces, 
            contract: contract, 
            location: location, 
            date: date 
        });

        if(announces.indexOf(this.state.advert_info) === -1) this.showAdvert(e, null);
    }

    goPage(e, page) {
        if(page > this.state.total_pages || page < 1)return 1;
        
        var index = page * this.state.items_per_page;
        var adverts_to_show = this.state.adverts.slice(index - this.state.items_per_page, index);

        this.setState({
            showed_adverts: adverts_to_show,
            current_page: page,
            page_adverts: adverts_to_show
        }, () => this.setFilter(e, this.state.contract, this.state.location, this.state.date));

        if(adverts_to_show.indexOf(this.state.advert_info) === -1) this.showAdvert(e, null);
    }

    showAdvert(e, advert) {
        if(e !== null) e.preventDefault();

        this.setState({ advert_info: advert });
    }

    render() {

        var contracts = [];
        var locations = [];

        for(var e = 0; e < this.state.showed_adverts.length; e++) {
            if(contracts.includes(this.state.showed_adverts[e].contract[0]) === false) contracts.push(this.state.showed_adverts[e].contract[0]);
            if(contracts.includes(this.state.showed_adverts[e].contract[1]) === false) contracts.push(this.state.showed_adverts[e].contract[1]);
        }

        for(var l = 0; l < this.state.showed_adverts.length; l++) {
            if(locations.includes(this.state.showed_adverts[l].location) === false) locations.push(this.state.showed_adverts[l].location);
        }

        const date_options = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'}

        return (
            <div className="App">

                <header className="nav">
                    <div className="nav-user">
                        {this.props.user === null   ?
                            <React.Fragment>
                                <Link to='/login' className="nav-user-link"><strong>Accedi</strong></Link>
                                <Link to='/register' className="nav-user-link">Registrati</Link>
                            </React.Fragment>       :
                            <React.Fragment>
                                <Link to='/login' className="nav-user-link">(<strong>{this.props.user_details.username}</strong>)</Link>
                                <a href="/#" onClick={this.logOut} className="nav-user-link">Esci</a>
                                <Link to='/insert' className="nav-user-link insert">
                                    <i className="fa fa-plus"></i> Inserisci un annuncio
                                </Link>
                            </React.Fragment>
                        }
                    </div> 
                </header>

                <section className="filters">
                    <select name="date" id="date" value={this.state.date !== null ? this.state.date : "null"} onChange={(e) => this.setFilter(e, this.state.contract, this.state.location, e.target.value)}>
                        <option value="null">Data di pubblicazione</option>
                        <option value="last_day">Ultime 24 ore</option>
                        <option value="three_days">Ultimi 3 giorni</option>
                        <option value="seven_days">Ultimi 7 giorni</option>
                        <option value="fourteen_days">Ultimi 14 giorni</option>
                        <option value="last_month">Ultimo mese</option>
                    </select>
                    <select name="location" id="location" value={this.state.location !== null ? this.state.location : "null"} onChange={(e) => this.setFilter(e, this.state.contract, e.target.value, this.state.date)}>
                        <option value="null">Località</option>
                        {this.state.showed_adverts.length > 0 && locations.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                    <select name="contract" id="contract" value={this.state.contract !== null ? this.state.contract : "null"} onChange={(e) => this.setFilter(e, e.target.value, this.state.location, this.state.date)}>
                        <option value="null">Tipologia contratto</option>
                        {this.state.showed_adverts.length > 0 && contracts.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                </section>

                {this.state.showed_adverts.length < 1 && <img src="https://i.gifer.com/ZZ5H.gif" alt="Loading" className="loading-img"/>}
                {this.state.page_adverts.length < 1 && this.state.showed_adverts.length > 0 && <div className="advert-list">Nessun annuncio trovato.</div>}
                {this.state.page_adverts.length > 0 && <section className="advert-list">
                    {this.state.page_adverts.map((announce, idx) =>
                        <div className="advert" key={idx}>
                            <div className="advert-img">
                                <img src="https://assets.subito.it/static/icons/categories/26.svg" alt="" />
                            </div>
                            <div className="advert-data">
                                <a href="/#" onClick={(e) => this.showAdvert(e, announce)} id={idx} key={idx}>{announce.title}</a>
                                <div className="advert-published">
                                    {announce.location} - pubblicato {new Date(announce.date.seconds * 1000).toLocaleDateString('it', date_options)}<br />
                                    {announce.contract.map(i => <div key={i}>{i}</div>)}
                                    {announce.month_salary > 0 && <p>{announce.month_salary} € / mese</p>}
                                </div>
                            </div>
                        </div>)}
                    </section>
                }

                {this.state.advert_info !== null && <section className="menu">
                    <a href="/#" className="menu-close" onClick={(e) => this.showAdvert(e, null)}><i className="fa fa-times"></i></a>
                    <Link to={{
                        pathname: "/advert/" + this.state.advert_info.id,
                        advert_info: this.state.advert_info, 
                        showAdvert: this.state.showAdvert 
                    }}><h3>{this.state.advert_info.title} <i className="fa fa-arrow-right" /></h3></Link>
                    <Item advert_info={this.state.advert_info} user={this.props.user} user_details={this.props.user_details}/>                 
                </section>}

                {this.state.total_pages > 1 && <section className="pagination">
                    <button type="button" onClick={(e) => this.goPage(e, this.state.current_page - 1)}><i className="fa fa-chevron-left fa-lg" /></button>
                    <span>{this.state.current_page}/{this.state.total_pages} </span>
                    <button type="button" onClick={(e) => this.goPage(e, this.state.current_page + 1)}><i className="fa fa-chevron-right fa-lg" /></button>
                </section>}

            </div>
        );
    }
}

export default withRouter(Home);