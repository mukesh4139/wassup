import * as am4core from "@amcharts/amcharts4/core";

import socket from "./socket";
import { truncateNoteBody, renderSentimentPieChart } from "./dashboard";
import { truncateNoteBodyForChartTooltip } from "./charts/utils";
import { stringifyNote } from "./note";

const { digestedAssetsPath } = App;
const noteItemSelector = noteId => `[data-behavior=note-item][data-note-id="${noteId}"]`;
const sentimentIconSelector = "[data-behavior=sentiment-icon]";
const favoriteToggleSelector = "[data-behavior=note-favorite-toggle]";
const noteBodySelector = "[data-behavior=note-body]";
const noteEditTriggerSelector = "[data-behavior=note-edit-trigger]";
const noteItemContextAttribute = "data-note-item-context";

const updateFavoriteIcon = (noteItem, { id, favorite }) => {
  const favoriteToggleElement = noteItem.querySelector(favoriteToggleSelector);

  if (!favoriteToggleElement) return;

  const favoriteIconPath = `/images/${favorite ? "star" : "unstar"}.svg`;
  const title = favorite ? "Unstar this note" : "Star this note";
  const newToggleTo = !favorite;
  const iconElement = favoriteToggleElement.querySelector("img");
  favoriteToggleElement.setAttribute("title", title);
  favoriteToggleElement.setAttribute("data-toggle-to", newToggleTo);
  iconElement && iconElement.setAttribute("src", digestedAssetsPath[favoriteIconPath]);
};

const updateSentimentIcon = (noteItem, { sentiment_icon_path }) => {
  const sentimentIconElement = noteItem.querySelector(sentimentIconSelector);

  if (sentimentIconElement) {
    sentimentIconElement.src = sentiment_icon_path;
  }
};

const updateNoteBody = (noteItem, note) => {
  const noteBodyElement = noteItem.querySelector(noteBodySelector);

  if (noteBodyElement) {
    // Body of note item in "Recent Notes" widget in dashboard is truncated
    const truncateLength = parseInt(noteBodyElement.getAttribute("data-truncate"));
    const body = truncateLength ? truncateNoteBody(note, truncateLength) : note.body;

    noteBodyElement.innerHTML = body;
  }
};

const updateEditTriggerDataAttribute = (noteItem, note) => {
  const editTriggerElement = noteItem.querySelector(noteEditTriggerSelector);

  if (editTriggerElement) {
    editTriggerElement.setAttribute("data-note", stringifyNote(note));
  }
};

const updateNoteOnDashboard = (noteItem, { sentiment_color }) => {
  const noteItemContext = noteItem.getAttribute(noteItemContextAttribute);

  if (noteItemContext === "dashboard") {
    noteItem.style.borderRightColor = sentiment_color;
  }
};

const updateNoteDataItemInLineCharts = note => {
  const { registry: { baseSprites } } = am4core;
  baseSprites.forEach(chart => {
    const { data } = chart;
    const chartDataItem = data.find(item => item.id === note.id);

    if (chartDataItem) {
      Object.assign(chartDataItem, note);
      chartDataItem.short_body = truncateNoteBodyForChartTooltip(note);

      chart.invalidateData();
    }
  });
};

const refreshPieChart = () => {
  const { registry: { baseSprites } } = am4core;
  const lineChart = baseSprites.filter(chart => chart.htmlContainer.id !== "sentiment-pie-chart")[0];

  if (lineChart) {
    renderSentimentPieChart(lineChart.data);
  }
};

const onNoteUpdate = ({ body: note }) => {
  const noteItems = document.querySelectorAll(noteItemSelector(note.id));

  for (const noteItem of noteItems) {
    updateSentimentIcon(noteItem, note);
    updateFavoriteIcon(noteItem, note);
    updateNoteBody(noteItem, note);
    updateEditTriggerDataAttribute(noteItem, note);
    updateNoteOnDashboard(noteItem, note);
  }

  updateNoteDataItemInLineCharts(note);
  refreshPieChart();
};

const joinChannel = () => {
  if (!socket) return;

  const channel = socket.channel(`note:updates:${App.userId}`, {});

  channel.on("update", onNoteUpdate);

  channel.join()
    .receive("ok", () => {})
    .receive("error", response => {
      console.error("Unable to join note updates channel", response)
    });
};

joinChannel();
