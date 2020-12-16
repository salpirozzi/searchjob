import React, { Component } from 'react';
import firebase from '../firebase';
import { withRouter, Link } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from 'yup';

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
            count: 0,
            advert: undefined,
            modal_open: false 
        };
        
        this.searchLocation = this.searchLocation.bind(this);
        this.addInput = this.addInput.bind(this);
        this.removeInput = this.removeInput.bind(this);
        this.deleteAdvert = this.deleteAdvert.bind(this);
        this.openModal = this.openModal.bind(this);
    }

    static getDerivedStateFromProps(props, state) {

        if(props.advert !== state.advert && props.advert !== undefined) {
            var req = [];

            for(var i = 0; i < props.advert.requirements.length; i++) {
                req.push("requirement" + i);
            }

            return {
                advert: props.advert, 
                requirements: req, 
                count: req.length + 1
            };
        }
        
        return null;
    }

    componentDidMount() {
        if(this.props.user === null)return this.props.history.push("/login");
    }

    openModal() {
        this.setState({ 
            modal_open: !this.state.modal_open 
        });
    }

    deleteAdvert() {
        const db = firebase.firestore();
        db.collection('adverts')
            .doc(this.state.advert.id)
            .delete();

        toast.error("Annuncio rimosso!");
    }

    removeInput(e, i) {
        e.preventDefault();

        let requirements = this.state.requirements;
        requirements.splice(i, 1);

        this.setState({ 
            requirements: requirements 
        });
    }

    addInput(e) {
        e.preventDefault();

        let requirements = this.state.requirements;
        let length = this.state.count;
        requirements.push("requirement" + length);

        this.setState({ 
            requirements: requirements, 
            count: (length + 1) 
        });
    }

    searchLocation(e, setFieldValue) {
        setFieldValue('location', e.target.value);
        if(e.target.value.length < 3)return false;
        /* DA INSERIRE: API Google Maps */
    }

    render() {

        var customRequirementsValue = {};

        if(this.state.advert !== undefined) for(var i = 0; i < this.state.advert.requirements.length; i++) {
            customRequirementsValue["requirement" + i] = this.state.advert.requirements[i];
        } 

        var customValues = {
            title: this.state.advert !== undefined ? this.state.advert.title : "",
            introduction: this.state.advert !== undefined ? this.state.advert.introduction : "", 
            location: this.state.advert !== undefined ? this.state.advert.location : "", 
            salary: this.state.advert !== undefined ? this.state.advert.month_salary : "", 
            time: this.state.advert !== undefined ? this.state.advert.contract[1] : "", 
            type: this.state.advert !== undefined ? this.state.advert.contract[0] : "", 
            date: new Date()
        };

        Object.assign(customValues, customRequirementsValue);

        return (
            <React.Fragment>

                {this.state.modal_open && 
                    <div className="modal">
                        <div className="modal-content">
                            <p>
                                Sei sicuro di voler eliminare l'annuncio <strong>{this.state.advert.title}?</strong>
                            </p>
                            <button 
                                type="button"
                                className="candidate error" 
                                onClick={this.deleteAdvert}
                            >
                                Sì
                            </button>
                            <button 
                                type="button"
                                className="candidate success" 
                                onClick={this.openModal}
                            >
                                No
                            </button>
                        </div>
                    </div>
                }

                <div className={this.state.advert === undefined ? "container" : ""}>

                    {this.state.advert === undefined && 
                        <Link to="/">
                            <img src="https://assets.subito.it/static/logos/lavoro.svg" alt="Logo" />
                        </Link>
                    }

                    <Formik
                        initialValues={customValues}
                        validationSchema={AdvertSchema}
                        onSubmit={values => {
                            var db = firebase.firestore();
                            var requirement_list = [];
                            this.state.requirements.forEach(field => requirement_list.push(values[field]));

                            if(this.state.advert === undefined) {
                                var expiry = new Date(values.date);
                                var date = new Date();

                                db.collection('adverts')
                                    .doc()
                                    .set({
                                        introduction: values.introduction,
                                        location: values.location,
                                        month_salary: values.salary,
                                        contract: [values.type, values.time],
                                        title: values.title,
                                        enterprise: this.props.user.uid,
                                        date: firebase.firestore.Timestamp.fromDate(date),
                                        requirements: requirement_list,
                                        expiry: firebase.firestore.Timestamp.fromDate(expiry)
                                    });

                                toast.success("Annuncio pubblicato con successo!");
                                this.props.history.push("/"); 
                                
                                return 1;
                            }

                            db.collection('adverts')
                                .doc(this.state.advert.id)
                                .update({
                                    introduction: values.introduction,
                                    location: values.location,
                                    month_salary: values.salary,
                                    contract: [values.type, values.time],
                                    title: values.title,
                                    requirements: requirement_list
                                });

                            toast.success("Annuncio aggiornato!");
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
                                    <i className="fa fa-font fa-lg" />
                                    <input 
                                        type="text" 
                                        name="title" 
                                        placeholder="Titolo inserzione" 
                                        value={values.title} 
                                        onChange={handleChange} 
                                        onBlur={handleBlur} 
                                    />
                                    {touched.title && errors.title && 
                                        <div className="input-error">
                                            {errors.title}
                                        </div>
                                    }
                                </div>
                                <div className="input-group">
                                    <textarea 
                                        name="introduction" 
                                        placeholder="Descrivi la posizione" 
                                        value={values.introduction} 
                                        rows={5} 
                                        onChange={handleChange} 
                                        onBlur={handleBlur} 
                                    />
                                    {touched.introduction && errors.introduction && 
                                        <div className="input-error">
                                            {errors.introduction}
                                        </div>
                                    }
                                </div>
                                <div className="input-group">
                                    <i className="fa fa-map-marker fa-lg" />
                                    <input 
                                        list="location_list" 
                                        name="location" 
                                        value={values.location} 
                                        autoComplete="off" 
                                        placeholder="Luogo" 
                                        onChange={(e) => this.searchLocation(e, setFieldValue)} 
                                        onBlur={handleBlur} 
                                    />
                                    <datalist id="location_list">
                                        <option value="Italia" />
                                        {this.state.locations.length > 0 && this.state.locations.map(
                                            (i) => <option value={i.address.label} key={i.id} />
                                        )}
                                    </datalist>
                                    {touched.location && errors.location && 
                                        <div className="input-error">
                                            {errors.location}
                                        </div>
                                    }
                                </div>  
                                <div className="input-group">
                                    <i className="fa fa-euro fa-lg" />
                                    <input 
                                        type="number" 
                                        name="salary" 
                                        placeholder="Stipendio mensile" 
                                        value={values.salary} 
                                        min={0} 
                                        max={10000} 
                                        onChange={handleChange} 
                                        onBlur={handleBlur} 
                                    />
                                    {touched.salary && errors.salary && 
                                        <div className="input-error">
                                            {errors.salary}
                                        </div>
                                    }
                                </div>

                                <div className="input-group-inline">
                                    <p>
                                        Requisiti per la posizione
                                    </p>
                                    <a href="/#" onClick={this.addInput}>
                                        <i className="fa fa-plus fa-lg" /> Aggiungi requisito
                                    </a>
                                </div>
                                {this.state.requirements.length > 0 && this.state.requirements.map(
                                    (field, i) => 
                                        <div className="input-group" key={i}>
                                            <a href="/#" onClick={(e) => this.removeInput(e, i, setFieldValue, field)}>
                                                <i className="fa fa-trash fa-lg" />
                                            </a>
                                            <input 
                                                type="text" 
                                                name={field} 
                                                key={i} 
                                                placeholder={"Requisito N°" + (i + 1)} 
                                                value={values[field] || ""} 
                                                onChange={handleChange} 
                                                onBlur={handleBlur} 
                                            />
                                        </div>
                                )}

                                <div className="input-group-inline">
                                    <p>
                                        Tipologia contratto
                                    </p>
                                    <div className="contract">
                                        <input 
                                            type="radio" 
                                            name="type" 
                                            value="Tempo determinato" 
                                            onChange={handleChange} 
                                            onBlur={handleBlur} 
                                            checked={values.type === "Tempo determinato"} 
                                        />
                                        <label htmlFor="determinato">
                                            Tempo determinato
                                        </label>
                                    </div>

                                    <div className="contract">
                                        <input 
                                            type="radio" 
                                            name="type" 
                                            value="Tempo indeterminato" 
                                            onChange={handleChange} 
                                            onBlur={handleBlur} 
                                            checked={values.type === "Tempo indeterminato"} 
                                        />
                                        <label htmlFor="indeterminato">
                                            Tempo indeterminato
                                        </label>
                                    </div>

                                    <div className="contract">
                                        <input 
                                            type="radio" 
                                            name="type" 
                                            value="Apprendistato" 
                                            onChange={handleChange} 
                                            onBlur={handleBlur} 
                                            checked={values.type === "Apprendistato"} 
                                        />
                                        <label htmlFor="apprendistato">
                                            Apprendistato
                                        </label>
                                    </div>

                                    <div className="contract">
                                        <input 
                                            type="radio" 
                                            name="type" 
                                            value="Contratto a chiamata" 
                                            onChange={handleChange} 
                                            onBlur={handleBlur} 
                                            checked={values.type === "Contratto a chiamata"} 
                                        />
                                        <label htmlFor="chiamata">
                                            Contratto a chiamata
                                        </label>
                                    </div>

                                    <div className="contract">
                                        <input 
                                            type="radio" 
                                            name="type" 
                                            value="Collaborazione con P.Iva" 
                                            onChange={handleChange} 
                                            onBlur={handleBlur} 
                                            checked={values.type === "Collaborazione con P.Iva"} 
                                        />
                                        <label htmlFor="collaborazione">
                                            Collaborazione con P.Iva
                                        </label>
                                    </div>

                                    <div className="contract">
                                        <input 
                                            type="radio" 
                                            name="type" 
                                            value="Contratto a progetto" 
                                            onChange={handleChange} 
                                            onBlur={handleBlur} 
                                            checked={values.type === "Contratto a progetto"} 
                                        />
                                        <label htmlFor="progetto">
                                            Contratto a progetto
                                        </label>
                                    </div>

                                    <div className="contract">
                                        <input 
                                            type="radio" 
                                            name="type" 
                                            value="Tirocinio/Stage" 
                                            onChange={handleChange} 
                                            onBlur={handleBlur} 
                                            checked={values.type === "Tirocinio/Stage"} 
                                        />
                                        <label htmlFor="progetto">
                                            Tirocinio/Stage
                                        </label>
                                    </div>

                                    {touched.type && errors.type && 
                                        <div className="input-error">
                                            {errors.type}
                                        </div>
                                    }
                                </div>
                                <div className="input-group-inline">
                                    <p>
                                        Durata contratto
                                    </p>
                                    <div className="contract">
                                        <input 
                                            type="radio" 
                                            name="time" 
                                            value="Tempo pieno" 
                                            onChange={handleChange} 
                                            onBlur={handleBlur} 
                                            checked={values.time === "Tempo pieno"} 
                                        />
                                        <label htmlFor="full-time">
                                            Tempo pieno
                                        </label>
                                    </div>

                                    <div className="contract">
                                        <input 
                                            type="radio" 
                                            name="time" 
                                            value="Part-time" 
                                            onChange={handleChange} 
                                            onBlur={handleBlur} 
                                            checked={values.time === "Part-time"} 
                                        />
                                        <label htmlFor="part-time">
                                            Part-time
                                        </label>
                                    </div>

                                    {touched.time && errors.time && 
                                        <div className="input-error">
                                            {errors.time}
                                        </div>
                                    }
                                </div>
                                {this.state.advert === undefined && <div className="input-group">
                                    <p>
                                        Scadenza bando
                                    </p>
                                    <input 
                                        type="date" 
                                        name="date" 
                                        value={values.date} 
                                        onChange={handleChange} 
                                        onBlur={handleBlur} 
                                    />
                                    {touched.date && errors.date && 
                                        <div className="input-error">
                                            {errors.date}
                                        </div>
                                    }
                                </div>}
                                <div className="input-group">
                                    {this.state.advert !== undefined && 
                                        <React.Fragment>
                                            <button 
                                                type="button" 
                                                className="candidate warning" 
                                                onClick={this.props.editMode}
                                            >
                                                Indietro
                                            </button>
                                            <button 
                                                type="button" 
                                                className="candidate error" 
                                                onClick={this.openModal}
                                            >
                                                Elimina
                                            </button>
                                            <button 
                                                type="submit" 
                                                className="candidate success" 
                                                disabled={!dirty}
                                            >
                                                Aggiorna
                                            </button>
                                        </React.Fragment>
                                    }
                                    {this.state.advert === undefined && 
                                        <button 
                                            type="submit" 
                                            className="btn-container success" 
                                            disabled={!dirty}
                                        >
                                            Pubblica
                                        </button>
                                    }
                                </div>
                            </form>
                        )}
                    </Formik>
                </div>
            </React.Fragment>
        );
    }
}

export default withRouter(Insert);