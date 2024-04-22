import React, { useCallback } from "react";

export enum Filter {
    Month,
    Week,
    Day,
};

export const filtertoString = (filter: Filter): String => {
    switch (filter) {
        case Filter.Day:
            return "day";
        case Filter.Week:
            return "week";
        case Filter.Month:
            return "month";
        default:
            break;
    }

    throw new Error("Invalid filter.");
};

interface Props {
    filter: Filter;
    handleChange: (filter: Filter) => void;
}

const DateFilter = (props: Props) => {
    const { filter, handleChange } = props;
    const onClick = useCallback((event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        const id = event.currentTarget.id;
        switch (id) {
            case "dayFilterButton":
                handleChange(Filter.Day);
                break;
            case "weekFilterButton":
                handleChange(Filter.Week);
                break;
            case "monthFilterButton":
                handleChange(Filter.Month);
                break;
            default:
                break;
        }
    }, [handleChange]);

    return (
        <div className='ml-auto text-base-content'>
            <button onClick={onClick} id="dayFilterButton" className={`${filter === Filter.Day ? "" : "text-base-content/50"}`}>D</button> / <button onClick={onClick} id="weekFilterButton" className={`${filter === Filter.Week ? "" : "text-base-content/50"}`}>W</button> / <button onClick={onClick} id="monthFilterButton" className={`${filter === Filter.Month ? "" : "text-base-content/50"}`}>M</button>
        </div>
    );
};

export default DateFilter;