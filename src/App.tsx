import React, { useState } from 'react';
import moment, { Moment } from "moment";
import 'moment/locale/pl'
import { map } from "ramda";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGlass, faInfoCircle } from "@fortawesome/pro-duotone-svg-icons";
import { createPortal } from "react-dom";
import Modal from "./Modal";
import Statistics from "./Statistics";

export const start = moment("2020-01-01 12:00")
export const end = moment("2021-01-01 12:00")
export const today = moment();

export type DayInfo = {
    date: Moment,
    drunk: boolean,
}

export type Months = { [month: string]: DayInfo[] };

const defaultMonths: Months = {};

for (let current = start.clone(); current.isBefore(end); current.add(1, 'days')) {
    defaultMonths[current.format("MMMM")] = defaultMonths[current.format("MMMM")] || [];
    defaultMonths[current.format("MMMM")].push({
        date: current.clone(),
        drunk: false,
    });
}

function replace<T>(index: number, value: T, array: T[]) {
    return [...array.slice(0, index), value, ...array.slice(index + 1)]
}

const filler = (days: DayInfo[]) => {
    const fill = (days[0].date.day() + 6) % 7;
    return new Array(fill).fill(null, 0, fill);
}

function save(months: Months) {
    const days: boolean[] = Object.values(months).flatMap(days => days.map(day => day.drunk));
    window.localStorage.setItem('drunk', JSON.stringify(days));
}

function load(): Months {
    const item = window.localStorage.getItem("drunk");

    if (!item) {
        return defaultMonths;
    }

    const loaded: boolean[] = JSON.parse(item);

    return map(days => days.map(day => ({
        date: day.date,
        drunk: loaded[day.date.dayOfYear() - 1],
    } as DayInfo)), defaultMonths);
}

const App = () => {
    const [months, setMonths] = useState<Months>(load());
    const [showStats, setShowStats] = useState<boolean>(false);

    const toggleDrunk = (day: DayInfo) => {
        const newMonths = {
            ...months,
            [day.date.format("MMMM")]: replace(day.date.date() - 1, { ...day, drunk: !day.drunk }, months[day.date.format("MMMM")]),
        };

        setMonths(newMonths);
        save(newMonths);

        return false;
    }

    const handleDayClick = (day: DayInfo) => (ev: any) => {
        toggleDrunk(day);
        ev.preventDefault();
    }

    const handleModalDismiss = () => setShowStats(false);
    const handleStatisticsAction = () => setShowStats(true);

    return <>
        <div className="app">
            <header className="app__header">
                <h1 className="app__heading">Kalendarz Alkoholika</h1>
                <a href="#statistics" className="app__action" onClick={ handleStatisticsAction }><FontAwesomeIcon icon={ faInfoCircle } /></a>
            </header>
            <div className="app__calendar">
                { Object.entries(months).map(([month, days]) => <div className="app__month" key={ month }>
                    <h2 className="app__month-name">{ month }</h2>
                    <ul className="app__days">
                        <li>pn</li>
                        <li>wt</li>
                        <li>śr</li>
                        <li>cz</li>
                        <li>pt</li>
                        <li>so</li>
                        <li>nd</li>
                    </ul>
                    <ul className="app__days">
                        { filler(days).map((_, i) => <li key={`filler-${i}`}/>) }
                        { days.map(day => <li key={ day.date.format("YYYY-MM-DD")} id={`day${day.date.format("YYYYMMDD")}`}>
                            <a href={`#day${day.date.format("YYYYMMDD")}`} className={`app__day ${day.drunk && 'app__day--drunk'} ${today.isBefore(day.date) && 'app__day--future'}`} onClick={ handleDayClick(day) }>
                                { day.date.format("D") }
                                { day.drunk && <FontAwesomeIcon icon={ faGlass } className="app__drunk-icon"/> }
                            </a>
                        </li>) }
                    </ul>
                </div>) }
            </div>
        </div>
        { showStats && createPortal(
            <Modal title="Statystyki" onClose={ handleModalDismiss } onLeave={ handleModalDismiss } id="statistics">
                <Statistics months={ months }/>
            </Modal>,
            document.getElementById("modals") as HTMLElement
        ) }
    </>;
}

export default App;
