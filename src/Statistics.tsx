import { DayInfo, Months, today } from "./App";
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowsH, faCalendarAlt, faCalendarDay, faGlass } from "@fortawesome/pro-duotone-svg-icons";
import { head, last, map, maxBy, minBy, reduce, toPairs } from "ramda";

const formatter = new Intl.NumberFormat("pl", { maximumFractionDigits: 1, minimumFractionDigits: 1});

type StatisticsProps = {
    months: Months;
}

function percent(number: number, of: number) {
    return `${formatter.format(number / of * 100)}%`;
}

type Buckets<T, TBucket = string> = { [bucket: string]: T[] }

function bucketize<T, TBucket>(input: T[], discriminator: (value: T) => TBucket): Buckets<T, TBucket> {
    const buckets: any = {};

    for (const item of input) {
        const bucket = discriminator(item);
        buckets[bucket] = buckets[bucket] || [];
        buckets[bucket].push(item);
    }

    return buckets as Buckets<T, TBucket>;
}

type Range<TOptions, TItem> = {
    value: TOptions,
    items: TItem[],
}

type Streak = Range<boolean, DayInfo>;

function *rangeify<TItem, TOptions>(input: TItem[], discriminator: (value: TItem) => TOptions) {
    let last: TOptions | undefined = undefined;
    let range: Range<TOptions, TItem> | undefined = undefined;

    for (const value of input) {
        const current = discriminator(value);

        if (last !== current) {
            if (typeof range !== "undefined") {
                yield range;
            }

            range = {
                value: current,
                items: [ value ],
            }
        } else {
            range?.items?.push(value);
        }

        last = current;
    }
}

export const Statistics = ({ months }: StatisticsProps) => {
    const all = Object.values(months).flat().filter(day => day.date.isBefore(today));

    const totalDrunkDays = all.filter(day => day.drunk);
    const totalNonDrunkDays = all.filter(day => !day.drunk);

    const byDay   = bucketize(all, day => day.date.format("dddd"));
    const byMonth = bucketize(all, day => day.date.format("MMMM"));

    const countsByDay   = map<Buckets<DayInfo>, { [month: string]: number }>(day => day.filter(day => day.drunk).length, byDay);
    const countsByMonth = map<Buckets<DayInfo>, { [month: string]: number }>(day => day.filter(day => day.drunk).length, byMonth);

    const minimum = minBy<[string, number]>(arr => arr[1]);
    const maximum = maxBy<[string, number]>(arr => arr[1]);

    const [ topDay, topDayCount ] = reduce(maximum, ['Brak', -Infinity], toPairs(countsByDay));
    const [ topMonth, topMonthCount ] = reduce(maximum, ['Brak', -Infinity], toPairs(countsByMonth));

    const [ worstDay, worstDayCount ] = reduce(minimum, ['Brak', Infinity], toPairs(countsByDay));
    const [ worstMonth, worstMonthCount ] = reduce(minimum, ['Brak', Infinity], toPairs(countsByMonth));

    const ranges = Array.from(rangeify(all, day => day.drunk));

    const maxStreak = maxBy<Streak>(range => range.items.length);

    const longestDrunk = reduce(maxStreak, { value: true, items: [] } as Streak, ranges.filter(range => range.value));
    const longestNotDrunk = reduce(maxStreak, { value: true, items: [] } as Streak, ranges.filter(range => !range.value));

    return <div className="statistics">
        <div className="statistics__summary">
            <div className="statistics__category statistics__category--non-drunk">
                <FontAwesomeIcon icon={ faGlass } size="3x" />
                <div className="statistics__label">Dni niepijących</div>
                <div className="statistics__value">{ totalNonDrunkDays.length }</div>
                <div className="statistics__value statistics__value--secondary">{ percent(totalNonDrunkDays.length, all.length) }</div>
            </div>
            <div className="statistics__category statistics__category--drunk">
                <FontAwesomeIcon icon={ faGlass } size="3x" />
                <div className="statistics__label">Dni pijących</div>
                <div className="statistics__value">{ totalDrunkDays.length }</div>
                <div className="statistics__value statistics__value--secondary">{ percent(totalDrunkDays.length, all.length) }</div>
            </div>
            <div className="statistics__category statistics__category">
                <FontAwesomeIcon icon={ faArrowsH } size="3x" />
                <div className="statistics__label">Streak trzeźwości</div>
                <div className="statistics__value">{ longestNotDrunk.items.length }</div>
                <div className="statistics__value statistics__value--secondary">
                    { head(longestNotDrunk.items)?.date.format("D MMM") }
                    -
                    { last(longestNotDrunk.items)?.date.format("D MMM") }
                </div>
            </div>
            <div className="statistics__category statistics__category--drunk">
                <FontAwesomeIcon icon={ faArrowsH } size="3x" />
                <div className="statistics__label">Streak picia</div>
                <div className="statistics__value">{ longestDrunk.items.length }</div>
                <div className="statistics__value statistics__value--secondary">
                    { head(longestDrunk.items)?.date.format("D MMM") }
                    -
                    { last(longestDrunk.items)?.date.format("D MMM") }
                </div>
            </div>
            <div className="statistics__category statistics__category--drunk">
                <FontAwesomeIcon icon={ faCalendarDay } size="3x" />
                <div className="statistics__label">Dzień do picia</div>
                <div className="statistics__value">{ topDay }</div>
                <div className="statistics__value statistics__value--secondary">{ topDayCount }x</div>
            </div>
            <div className="statistics__category statistics__category--drunk">
                <FontAwesomeIcon icon={ faCalendarAlt } size="3x" />
                <div className="statistics__label">Pijany miesiąc</div>
                <div className="statistics__value">{ topMonth }</div>
                <div className="statistics__value statistics__value--secondary">{ topMonthCount } dni</div>
            </div>
            <div className="statistics__category">
                <FontAwesomeIcon icon={ faCalendarDay } size="3x" />
                <div className="statistics__label">Dzień nie do picia</div>
                <div className="statistics__value">{ worstDay }</div>
                <div className="statistics__value statistics__value--secondary">{ worstDayCount }x</div>
            </div>
            <div className="statistics__category">
                <FontAwesomeIcon icon={ faCalendarAlt } size="3x" />
                <div className="statistics__label">Trzeźwy miesiąc</div>
                <div className="statistics__value">{ worstMonth }</div>
                <div className="statistics__value statistics__value--secondary">{ worstMonthCount } dni</div>
            </div>
        </div>
    </div>;
}

export default Statistics;
