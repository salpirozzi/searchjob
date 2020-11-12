/* https://stackoverflow.com/questions/49372164/check-a-document-field-for-a-specific-value-in-cloud-firestore */

import React, { Component } from 'react';
import firebase from './firebase';
import { withRouter, Link } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from 'yup';
//import axios from 'axios';

import { toast } from 'react-toastify';

const AdvertSchema = Yup.object().shape({
    title: Yup.string()
      .required("Inserisci un titolo.")
      .min(3, "Il titolo deve contenere almeno 3 caratteri.")
      .max(30, "Il titolo può contenere al massimo 30 caratteri.")
      .matches(/^[a-zA-Z ]+$/, "Il titolo deve contenere solo lettere."),
    introduction: Yup.string()
      .required("Inserisci una descrizione.")
      .matches(/^[A-Za-z\u00C0-\u00FF0-9_-\s\d[',./():@]*$/, "La descrizione non può contenere caratteri speciali."),
    salary: Yup.number()
      .required("Inserisci uno stipendio mensile.")
      .min(0, "Lo stipendio dev'essere di almeno 0 €.")
      .max(10000, "Lo stipendio può essere di massimo 10.000 €."),
    location: Yup.string()
        .required("Inserisci un luogo di lavoro."),
    type: Yup.string()
        .required("Scegli il tipo di contratto."),
    time: Yup.string()
        .required("Scegli la durata del contratto."),
    date: Yup.date() 
        .required("Inserisci una data di scadenza.")
        .max(new Date(new Date().valueOf() + 1000 * 3600 * 24 * 30), "L'inserzione non può durare più di 30 giorni.")
        .min(new Date(), "Non puoi inserire una data precedente o uguale a quella di oggi.")
})

class Insert extends Component {

    constructor() {
        super();

        this.state = {
            locations: "", 
            requirements: [], 
            count: 0 
        };
        
        this.searchLocation = this.searchLocation.bind(this);
        this.addInput = this.addInput.bind(this);
        this.removeInput = this.removeInput.bind(this);
    }

    componentDidMount() {
        if(this.props.user === null) this.props.history.push("/login");
    }

    removeInput(e, i) {
        e.preventDefault();
        var requirements = this.state.requirements;
        requirements.splice(i, 1);
        this.setState({ requirements: requirements });
    }

    addInput(e) {
        e.preventDefault();
        var requirements = this.state.requirements;
        var length = this.state.count;
        requirements.push("requirement" + length);
        this.setState({ requirements: requirements, count: (length + 1) });
    }

    searchLocation(e, setFieldValue) {
        setFieldValue('location', e.target.value);
        if(e.target.value.length < 3)return 0;

        /*axios.get("https://autosuggest.search.hereapi.com/v1/geocode?q=" + e.target.value + "&apiKey=EBfFMQ4TIe_CXg-9xNyknhnzhHB42ZViMoOEprC14j0&at=42.638426,12.674297&in=countryCode%3AITA")
            .then(res => { 
                this.setState({ locations: res.data.items });
            })
            .catch(err => console.log(err));*/
    }

    render() {

        return (
            <div className="App">
                <div className="container">
                    <Link to="/"><img src="https://assets.subito.it/static/logos/lavoro.svg" alt="Logo" /></Link>
                    <Formik
                        initialValues={{ introduction: "", location: "", salary: "", date: "", time: "", type: "", title: "" }}
                        validationSchema={AdvertSchema}
                        onSubmit={values => {
                            var db = firebase.firestore();
                            var date = new Date();
                            var expiry = new Date(values.date);
                            var requirement_list = [];
                            this.state.requirements.forEach(field => {
                                requirement_list.push(values[field]);
                            });
                            db.collection('adverts').doc().set({
                                introduction: values.introduction,
                                location: values.location,
                                month_salary: values.salary,
                                contract: [values.type, values.time],
                                title: values.title,
                                enterprise: this.props.user_details.username,
                                date: firebase.firestore.Timestamp.fromDate(date),
                                requirements: requirement_list,
                                expiry: firebase.firestore.Timestamp.fromDate(expiry)
                            })
                            toast.success("Annuncio pubblicato con successo!");
                            this.props.history.push("/");
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
                                <div className="input-group">
                                    <i className="fa fa-font fa-lg"></i>
                                    <input type="text" name="title" placeholder="Titolo inserzione" value={values.title} onChange={handleChange} onBlur={handleBlur} />
                                    {touched.title && errors.title && <div className="input-error">{errors.title}</div>}
                                </div>
                                <div className="input-group">
                                    <textarea name="introduction" placeholder="Descrivi la posizione" value={values.introduction} rows={5} onChange={handleChange} onBlur={handleBlur} />
                                    {touched.introduction && errors.introduction && <div className="input-error">{errors.introduction}</div>}
                                </div>
                                <div className="input-group">
                                    <i className="fa fa-map-marker fa-lg"></i>
                                    <input list="location_list" name="location" value={values.location} autoComplete="off" placeholder="Luogo" onChange={(e) => this.searchLocation(e, setFieldValue)} onBlur={handleBlur} />
                                    <datalist id="location_list">
                                        <option value="Italia" />
                                        {this.state.locations.length > 0 && this.state.locations.map(i => <option value={i.address.label} key={i.id}/>)}
                                    </datalist>
                                    {touched.location && errors.location && <div className="input-error">{errors.location}</div>}
                                </div>  
                                <div className="input-group">
                                    <i className="fa fa-euro fa-lg"></i>
                                    <input type="number" name="salary" placeholder="Stipendio mensile" value={values.salary} min={0} max={10000} onChange={handleChange} onBlur={handleBlur} />
                                    {touched.salary && errors.salary && <div className="input-error">{errors.salary}</div>}
                                </div>  
                                <div className="input-group-inline">
                                    <p>Requisiti per la posizione</p>
                                    <a href="/#" onClick={this.addInput}><i className="fa fa-plus fa-lg" /> Aggiungi requisito</a>
                                    {this.state.requirements.length > 0 && this.state.requirements.map((field, i) => 
                                        <div className="input-group" key={i}>
                                            <a href="/#" onClick={(e) => this.removeInput(e, i, setFieldValue, field)}><i className="fa fa-trash fa-lg" /></a>
                                            <input type="text" name={field} key={i} placeholder={"Requisito N°" + (i + 1)} value={values[field] || ""} onChange={handleChange} onBlur={handleBlur} />
                                        </div>
                                    )}
                                </div>  
                                <div className="input-group-inline">
                                    <p>Tipologia contratto</p>

                                    <div className="contract">
                                        <input type="radio" name="type" value="Tempo determinato" onChange={handleChange} onBlur={handleBlur} />
                                        <label htmlFor="determinato">Tempo determinato</label>
                                    </div>

                                    <div className="contract">
                                        <input type="radio" name="type" value="Tempo indeterminato" onChange={handleChange} onBlur={handleBlur} />
                                        <label htmlFor="indeterminato">Tempo indeterminato</label>
                                    </div>

                                    <div className="contract">
                                        <input type="radio" name="type" value="Apprendistato" onChange={handleChange} onBlur={handleBlur} />
                                        <label htmlFor="apprendistato">Apprendistato</label>
                                    </div>

                                    <div className="contract">
                                        <input type="radio" name="type" value="Contratto a chiamata" onChange={handleChange} onBlur={handleBlur} />
                                        <label htmlFor="chiamata">Contratto a chiamata</label>
                                    </div>

                                    <div className="contract">
                                        <input type="radio" name="type" value="Collaborazione con P.Iva" onChange={handleChange} onBlur={handleBlur} />
                                        <label htmlFor="collaborazione">Collaborazione con P.Iva</label>
                                    </div>

                                    <div className="contract">
                                        <input type="radio" name="type" value="Contratto a progetto" onChange={handleChange} onBlur={handleBlur} />
                                        <label htmlFor="progetto">Contratto a progetto</label>
                                    </div>

                                    <div className="contract">
                                        <input type="radio" name="type" value="Tirocinio/Stage" onChange={handleChange} onBlur={handleBlur} />
                                        <label htmlFor="progetto">Tirocinio/Stage</label>
                                    </div>

                                    {touched.type && errors.type && <div className="input-error">{errors.type}</div>}
                                </div>
                                <div className="input-group-inline">
                                    <p>Durata contratto</p>

                                    <div className="contract">
                                        <input type="radio" name="time" value="Tempo pieno" onChange={handleChange} onBlur={handleBlur} />
                                        <label htmlFor="full-time">Tempo pieno</label>
                                    </div>

                                    <div className="contract">
                                        <input type="radio" name="time" value="Part-time" onChange={handleChange} onBlur={handleBlur} />
                                        <label htmlFor="part-time">Part-time</label>
                                    </div>

                                    {touched.time && errors.time && <div className="input-error">{errors.time}</div>}
                                </div>
                                <div className="input-group">
                                    <p>Scadenza bando</p>
                                    <input type="date" name="date" value={values.date} onChange={handleChange} onBlur={handleBlur} />
                                    {touched.date && errors.date && <div className="input-error">{errors.date}</div>}
                                </div>
                                <div className="input-group">
                                    <button type="submit" className="btn-container insert" disabled={!dirty}>Pubblica</button>
                                </div>
                            </form>
                        )}
                    </Formik>
                </div>
            </div>
        );
    }
}

export default withRouter(Insert);