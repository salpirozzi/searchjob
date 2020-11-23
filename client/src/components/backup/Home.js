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

import { toast } from 'react-toastify';

const FILE_SIZE = '200000'; //200 KB - unità di misura: BYTE
const SUPPORTED_FORMATS = ['application/doc', 'application/docx', 'application/pdf'];

const CandidateSchema = Yup.object().shape({
    introduction: Yup.string()
        .matches(/^[A-Za-z\u00C0-\u00FF0-9_-\s\d[',./():@]*$/, "La presentazione non può contenere caratteri speciali."),
    curriculum: Yup.mixed() 
        .required("Inserisci un curriculum vitae.")
        .test('fileSize', "File troppo grande. (max 200 kb)", value => value.size <= FILE_SIZE) 
        .test('fileType', "Estensione non supportata. (.pdf .doc .docx)", value => SUPPORTED_FORMATS.includes(value.type))
})

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
            items_per_page: 2,
            msgbox: false,
            subscribed: false
        };
        this.filterbyDate = this.filterbyDate.bind(this);
        this.logOut = this.logOut.bind(this);
        this.showMsgBox = this.showMsgBox.bind(this);
        this.isSubscribed = this.isSubscribed.bind(this);
    }

    isSubscribed(advert) {
        var db = firebase.firestore();
        var index = this.state.adverts.indexOf(advert);
        var query = db.collection('nominations');
                    query = query.where("advert_id", "==", index);
                    query = query.where("candidate_id", "==", this.props.user.uid);

        query.get().then(res => {
            var subscribed = (res.docs.length < 1) ? false : true;
            this.setState({ subscribed: subscribed });
        });
    }

    showMsgBox(e) {
        e.preventDefault();

        if(this.state.subscribed === true) return 0;

        if(this.props.user === null) 
            return this.props.history.push("/register");

        this.setState({ msgbox: !this.state.msgbox });
    }

    logOut(e) {
        e.preventDefault();

        firebase.auth().signOut()
            .then(() => toast.success("Logout effettuato."))
            .catch(error => console.log(error));
    }

    componentDidMount() {
        var db = firebase.firestore();
        db.collection('adverts').orderBy('date', 'desc').onSnapshot(results => {
            const data = results.docs.map(doc => {
                var res = doc.data();
                res["id"] = doc.id; return res;
            });
            var number_page = Math.round(data.length / this.state.items_per_page);
            var adverts_to_show = data.slice(0, this.state.items_per_page);
            this.setState({ 
                adverts: data, 
                showed_adverts: adverts_to_show, 
                total_pages: (!number_page) ? 1 : number_page, 
                page_adverts: adverts_to_show 
            }/*, () => this.setFilter(e, this.state.contract, this.state.location, this.state.date)*/);
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

        this.showAdvert(e, null);
    }

    showAdvert(e, advert) {
        e.preventDefault();

        if(this.state.msgbox === true && advert === null) 
            return this.showMsgBox(e);
        
        if(advert !== null && this.props.user !== null) this.isSubscribed(advert);
        this.setState({ advert_info: advert, msgbox: false });
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
                   
                    <div className="menu-intro">
                        <Link to={"/advert/" + this.state.advert_info.id}><h3>{this.state.advert_info.title}</h3></Link>
                        <p>{this.state.advert_info.enterprise} - {this.state.advert_info.location}</p>
                        {this.state.advert_info.contract.map(i => <p key={i}>{i}</p>)}
                    </div><hr />
                    {this.state.msgbox === false && <React.Fragment>
                        <div className="menu-details">
                            {this.state.advert_info.introduction}
                            <ul>{this.state.advert_info.requirements.map(object => <li key={object}>{object}</li>)}</ul>
                            {this.state.advert_info.month_salary > 0 && <p><strong>Stipendio</strong>: {this.state.advert_info.month_salary} € / mese</p>}
                        </div>
                        <div className="menu-button">
                            {this.state.subscribed === false && <button className="insert" id="candidate" onClick={this.showMsgBox}>Candidati</button>}
                            {this.state.subscribed === true && <div className="menu-subscribed"><i className="fa fa-check fa-lg" /> Sei già iscritto a quest'annuncio!</div>}
                        </div>
                    </React.Fragment>}
                    {this.state.msgbox === true && <React.Fragment>
                        <Formik
                            initialValues={{ introduction: "", curriculum: "" }}
                            validationSchema={CandidateSchema}
                            validateOnBlur={false} 
                            validateOnChange={false}                    
                            onSubmit={(values, { resetForm }) => {
                                var upload = firebase.storage().ref('Curriculums/' + this.props.user.uid).put(values.curriculum);
                                upload.then(() => {
                                    upload.snapshot.ref.getDownloadURL().then(r => {
                                        var db = firebase.firestore();
                                        var today = new Date();
                                        var index = this.state.adverts.indexOf(this.state.advert_info);
                                        db.collection('nominations').doc().set({
                                            advert_id: index,
                                            candidate_id: this.props.user.uid,
                                            subscribed_at: firebase.firestore.Timestamp.fromDate(today)
                                        })
                                        axios.post("/api/candidate", {introduction: values.introduction, curriculum: r, advert: this.state.advert_info, user: this.props.user, user_details: this.props.user_details});
                                        toast.success("Candidatura inviata con successo.");
                                        this.setState({ msgbox: false, subscribed: true });
                                        resetForm({});
                                    });
                                })
                                upload.catch(err => console.log(err));
                            }}
                        >
                        {({
                            values,
                            touched,
                            errors,
                            handleChange,
                            handleBlur,
                            handleSubmit,
                            dirty,
                            setFieldValue
                        }) => (
                            <form onSubmit={handleSubmit}>
                                <div className="menu-msgbox">
                                    <label htmlFor="introduction"><strong>Inserisci una lettera di presentazione</strong> (opzionale)</label>
                                    <textarea placeholder="Lettera di presentazione" rows={5} name="introduction" value={values.introduction} onChange={handleChange} onBlur={handleBlur} />
                                    {touched.introduction && errors.introduction && <div className="input-error">{errors.introduction}</div>}

                                    <label htmlFor="curriculum"><strong>Allega il tuo curriculum</strong></label>
                                    <input type="file" name="curriculum" accept=".doc, .docx, .pdf" onChange={e => setFieldValue("curriculum", e.currentTarget.files[0])} onBlur={handleBlur} />
                                    {touched.curriculum && errors.curriculum && <div className="input-error">{errors.curriculum}</div>}
                                </div>
                                <div className="menu-button">
                                    <button type="submit" className="insert" id="candidate" disabled={!dirty}>Invia</button>
                                </div>
                            </form>
                            )}
                        </Formik>
                        </React.Fragment>
                    }
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