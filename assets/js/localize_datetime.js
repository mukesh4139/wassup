import { moment } from "@bevacqua/rome";

const dateTimeSelector = "[data-behavior=localize-datetime]";

const localizeDateTime = utcDateTime => moment.utc(utcDateTime).local();

const dateTimeFromNow = utcDateTime => localizeDateTime(utcDateTime).fromNow();

const localizeDateTimes = () => {
  for (let element of document.querySelectorAll(dateTimeSelector)) {
    const utcDateTime = element.getAttribute("data-datetime") || new Date();
    const localDateTime = localizeDateTime(utcDateTime).format('MMM DD, YYYY - hh:mm:ss A');
    element.innerText = localDateTime;
  }
}

export {
  dateTimeFromNow,
  localizeDateTime,
  localizeDateTimes
};
