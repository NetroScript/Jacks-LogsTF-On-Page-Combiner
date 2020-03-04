// ==UserScript==
// @name         Jacks Log Combiner
// @namespace    https://github.com/NetroScript/
// @version      0.1.9
// @description  Allows you to combine logs on logs.tf directly on the page.
// @author       NetroScript
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.2.2/jszip.min.js
// @match        http://logs.tf/*
// @match        https://logs.tf/*
// @connect      serveme.tf
// @run-at       document-end
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_openInTab
// @grant        GM_xmlhttpRequest
// @downloadURL  https://github.com/NetroScript/Jacks-LogsTF-On-Page-Combiner/raw/master/Jacks-LogsTF-On-Page-Combiner.user.js
// @updateURL    https://github.com/NetroScript/Jacks-LogsTF-On-Page-Combiner/raw/master/Jacks-LogsTF-On-Page-Combiner.meta.js
// @supportURL   https://github.com/NetroScript/Jacks-LogsTF-On-Page-Combiner/issues
// ==/UserScript==

(function () {
	"use strict";
	// Constants
	const version = "0.1.8";
	const github_url = "https://github.com/NetroScript/Jacks-LogsTF-On-Page-Combiner/";

	// Our custom CSS
	const custom_css = `
<style>
.log_add_button, .log_add_button_on_log_page {
	font-weight: 900;
	font-size: 120%;
	width: 25px;
	height: 24px;
	padding: 0px;
	position: absolute;
	transform: translate(-36px, -4px);
	line-height: 24px;
}
.log_add_button_on_log_page {
	transform: translate(-28px, 36px);
}
.combiner_container {
	position: fixed;
	width: 400px;
	right: 0px;
	z-index: 1000;
	background-color: white;
	max-height: 90%;
	overflow-y: scroll;
	overflow-x: hidden;
	top: 50%;
	transform: translateY(-50%);
}
.combine_text {
	padding: 20px;
	font-weight: 600;
}
.button_container {
	display: flex;
	align-content: center;
	align-items: center;
	justify-content: center;
}
.button_container>.btn {
margin: 10px;
}
.combiner_upload_container, .combiner_upload_zip_container, .combiner_global_settings_container {
	position: fixed;
	width: 400px;
	right: 50%;
	text-align: center;
	padding: 30px;
	z-index: 1000;
	box-shadow: 0px 0px 50px 1px #00000045;
	background-color: white;
	top: 50%;
	transform: translate(50%, -50%);
}
.progress {
	height: 100%;
	width: 80%;
	background-color: #62dd62;
	border-bottom: 2px solid #3eb652;
}
.progress-bar {
	width: 100%;
	height: 30px;
	background-color: #f2f2f2;
	border-bottom: 2px solid #cccccc;
}
.progress_number {
	margin-top: -26px;
	font-weight: 800;
}
.spacer {
	margin: 10px 0px;
	height: 2px;
	background-color: #e4e4e4;
}
.combiner_upload_container input, .combiner_global_settings_container input, .combiner_upload_zip_container input {
	width: 100%;
	border: none;
	padding: 15px 10px;
	text-align: center;
	background-color: #eeeeee;
	box-sizing: border-box;
}
.combiner_upload_container.hide, .combiner_global_settings_container.hide {
	display:none;
	visibility: hidden;
}

.checkbox_container {
	display: flex;
    vertical-align: middle;
    justify-content: center;
}

input.combiner_minify, input.zip_combine {
    width: initial;
    margin-top: 13px;
    margin-right: 10px;
}

.zip_upload_status {
    margin-left: 5px;
}

.loadingdots:after {
	content: ' .';
	animation: loading 1s infinite;
	transition: all 0.25s;
}

@keyframes loading {
	0%, 10% {
		opacity: 1.0;
		color: transparent;
		text-shadow: 4px 0 0 transparent, 8px 0 0 transparent;
	}
	30% {
		color: black;
		text-shadow: 4px 0 0 transparent, 8px 0 0 transparent;
	}
	50% {
		text-shadow: 4px 0 0 black, 8px 0 0 transparent;
	}
	70%, 90% {
		text-shadow: 4px 0 0 black, 8px 0 0 black;
		opacity: 1.0;
	}
	100% {
		opacity: 0.0;
	}
}
</style>
`;

	// Custom HTML elements
	const combiner_container = `
<div class="combiner_container">
	<div class="combine_text">The following logs will be combined:</div>
	<table class="table loglist">
		<thead>
			<tr>
				<th>Title</th>
				<th>Map</th>
			</tr>
		</thead>
		<tbody class="entries">
		</tbody>
	</table>
	<div class="button_container">
		<div class="btn btn-success" id="combine_logs">Combine the Logs</div>
		<div class="btn btn-danger" id="cancel_combine">Cancel and clear the logs</div>
	</div>
</div>`;

	const upload_container = `<div class="combiner_upload_container hide">
	<h2>Creating combined log</h2>
	<div class="progress-bar">
		<div class="progress"></div>
		<div class="progress_number"></div>
	</div>
	<h4 class="progress_current_step"></h4>
	<div class="spacer"></div>
	<div class="upload_settings_container">
		<h4>Title for the log:</h4>
		<input class="log_title" type="text" name="log_title" placeholder="Enter a title for the log" maxlength="40">
		<h4>Map displayed:</h4>
		<input class="log_map" type="text" name="log_map" placeholder="Enter a mapname" maxlength="24">
		<div class="button_container">
			<div class="btn btn-success disabled finalize_upload">Upload</div>
			<div class="btn btn-danger cancel_upload">Cancel</div>
		</div>
	</div>
	<div class="upload_close_container hide">
		<div class="button_container">
			<div class="btn btn-danger close_upload">Close</div>
		</div>
	</div>
</div>`;

	const zip_upload_container = `<div class="combiner_upload_zip_container hide">
	<h2>Upload logs from a zip File</h2>
	<div class="spacer"></div>
	<div class="upload_settings_container">
		<h4>URL to zip</h4>
		<input class="zip_file_url" type="text" placeholder="Enter the URL for a zip file (f.e. serveme zip)">
		<div class="checkbox_container">
			<input class="zip_combine" type="checkbox">
			<h4>Check to do the upload combined, otherwise it will be done per map</h4>
		</div>
		<div class="checkbox_container">
            <h4>Status: </h4><h4 class="zip_upload_status">Waiting for Fetch.</h4>
		</div>
		<div class="button_container">
			<div class="btn btn-success zip_upload_interact">Fetch Logs</div>
			<div class="btn btn-danger cancel_zip">Cancel</div>
		</div>
	</div>
</div>`;

	const settings_container = `<div class="combiner_global_settings_container hide">
	<h2>Log Combiner Settings</h2>
	<div class="spacer"></div>
    <a href="${github_url}">View the Github page</a>
	<div class="spacer"></div>
	<div class="_settings_container">
		<h4>API Key</h4>
		<input class="combiner_api_key" type="text" placeholder="Enter a custom API key">
		<div class="checkbox_container">
			<input class="combiner_minify" type="checkbox">
			<h4>Advanced log minifying</h4>
		</div>
		<h6>This (tries) to keep the accuracy stat intact while greatly reducing log size. Be aware you lose up to 1% accuracy with every log added due to potential rounding errors.</h6>
		<div class="spacer"></div>
		<div class="button_container">
			<div class="btn upload_zip">Upload Logs from a zip</div>
		</div>
		<div class="spacer"></div>
		<div class="button_container">
			<div class="btn btn-success save_combiner_settings">Save and close</div>
			<div class="btn btn-danger cancel_settings">Cancel</div>
		</div>
	</div>
</div>`;


	//--------------------------Polyfill used functions if they don't exist---------------------------------------------

	// We are using the old var here to be able to define it in the global scope, because let would be local to the if 
	// and without let the variable is not defined at all

	// Use the LocalStorage API to replace get-, set- and delete- Value
	if (typeof GM_getValue !== "function") {
		window.GM_getValue = (key_name, default_value) => {
			let value = window.localStorage.getItem(key_name);

			// If no value is saved yet, return the default value
			if (value === null) {
				return default_value;
			}
			return value;
		};
	}
	if (typeof GM_setValue !== "function") {
		window.GM_setValue = (key_name, value) => {
			window.localStorage.setItem(key_name, value);
		};
	}
	if (typeof GM_deleteValue !== "function") {
		window.GM_deleteValue = (key_name) => {
			window.localStorage.removeItem(key_name);
		};
	}
	if (typeof GM_openInTab !== "function") {
		window.GM_openInTab = (url) => {
			// Window.open doesn't permit any options of the Tampermonkey extension, so we just drop the options
			window.open(url, "_blank");
		};
	}

	//------------------------------------------------------------------------------------------------------------------

	// Add the settings menu to the bottom
	$(".container.footer .nav").append(`<li style="float:right"><a href="${github_url}" class="log_combiner_open_settings">Jack's Log Combiner v${version} is installed</a></li>`);


	// Global variables / settings used
	let api_key = GM_getValue("api_key", "");
	let smart_compact_log = GM_getValue("smart_compact_log", true);
	let logs_to_be_combined = JSON.parse(GM_getValue("to_be_combined", "{}"));
	let log_file_data = {};
	let custom_logs = {};
	let total_combine_steps = 0;
	let cancel_upload = false;
	let currently_uploading = false;

	let is_logged_in = true;


	// Check if the user is currently logged in and act differently depending on that
	if ($("[alt='Sign in through Steam']").length > 0) {
		is_logged_in = false;

		if (api_key != "" && api_key != "None") {
			console.log("User is not logged in, but we have an API key saved, so we will contineu");
		} else {
			console.log("User is not logged in, the user script will do nothing c:");
			return;
		}

	}

	// No API key is defined but the user is logged in, so we get the API key
	if (api_key == "" || api_key == "None") {
		fetch(location.protocol + "//logs.tf/uploader").then((response) => {
			return response.text();
		}).then(async (text) => {
			// Set the API key
			api_key = text.split("id=\"apikey\">")[1].split("</span")[0];
			// If it is none the user never used one before, so we let the page generate one for him
			if (api_key == "None") {
				let token = text.split("/createkey?t=")[1].split("',")[0];
				// eslint-disable-next-line require-atomic-updates
				api_key = await (await fetch(location.protocol + "//logs.tf/createkey?t=" + token, {
					"referrer": location.protocol + "//logs.tf/uploader",
					"method": "GET",
					"mode": "cors"
				})).text();
			}
			GM_setValue("api_key", api_key);
		});
	}

	// Add our custom CSS and elements to the DOM
	$("head").append(custom_css);
	$("body").append(combiner_container);
	$("body").append(upload_container);
	$("body").append(settings_container);
	$("body").append(zip_upload_container);
	$("[id^=log_]>td:first-child").prepend("<div class=\"btn btn-success log_add_button\">+</div>");
	$(".log-header-left").prepend("<div class=\"btn btn-success log_add_button_on_log_page\">+</div>");


	// | Used main functions | -----------------------------------------------------------------------------------------

	// Update the log list
	function updateToBeCombinedLogList() {

		// Save the currently selected logs
		GM_setValue("to_be_combined", JSON.stringify(logs_to_be_combined));


		let amount = Object.keys(logs_to_be_combined).length;

		// If there are no logs hide the current log container, otherwise show it
		if (amount == 0) {
			$(".combiner_container").hide();
		} else {
			$(".combiner_container").show();
			$(".combiner_container .entries").html("");
		}

		// For every active log change the style to the remove button and add an entry into the sidebar list
		for (let log in logs_to_be_combined) {
			let logdata = logs_to_be_combined[log];
			disable_button($(`#log_${log} .log_add_button`));
			if ("/" + log == location.pathname) {
				disable_button($(".log_add_button_on_log_page"));
			}

			$(".combiner_container .entries").append(`<tr id="${logdata.id}">
<td class="title">${logdata.name}</td>
<td class="map">${logdata.map}</td>
</tr>`);

		}

	}

	// Helper function to clear all the saved logs
	function clear_current_logs() {

		for (let log in logs_to_be_combined) {
			enable_button($(`#log_${log} .log_add_button`));
			if ("/" + log == location.pathname) {
				enable_button($(".log_add_button_on_log_page"));
			}
		}

		logs_to_be_combined = {};
		updateToBeCombinedLogList();
	}

	// Get the log content from a log ID
	async function get_log_text(log_id) {
		let log = "";
		let response = await fetch(location.protocol + "//logs.tf/logs/log_" + log_id + ".log.zip", {
			method: "GET"
		});
		let zip_file = await JSZip.loadAsync(response.blob());

		for (let file in zip_file.files) {
			log += await zip_file.files[file].async("text");
		}
		return log;
	}

	// Shorten the content of a log to essential parts
	function process_log_file(log) {

		// Initialise variables
		let start_line = 0;
		let end_line = 0;
		let line_counter = 0;
		let tournament = false;
		let tournament_exists = true;

		// Check if the log even contains a round
		if (log.match(/Tournament mode started/)) {
			tournament_exists = true;
		}

		// Get all lines into a variable
		let lines = log.split("\n");

		// Add the first log line
		let out = lines[0] + "\n";

		lines.forEach((line) => {

			// Get the interesting part for us (after the timestamp)
			let parts = line.split(": ");

			if (parts.length > 1) {
				let logged_information = parts[1];
				// Start
				if (logged_information.startsWith("Tournament mode started")) {
					tournament = true;
					// Start counting the lines if the world triggered round start for the first time
				} else if (!tournament && logged_information.startsWith("World triggered \"Round_Start\"") && tournament_exists) {
					start_line = line_counter;
					tournament_exists = false;
					// If the log closed for once, end the line_counter
				} else if (logged_information.startsWith("Log file closed.")) {
					end_line = line_counter;
				}
			}
			line_counter++;
		});

		// If there was no log closed line, set the end line to the last line
		if (end_line == 0) {
			end_line = line_counter - 1;
		}

		let clear_regexes = [
			/position_report \(position /
		];

		let smart_advanced_clearing = [
			/triggered "shot_hit"/,
			/triggered "shot_fired"/
		];

		// When smart log compacting is enabled we will keep the necessairy lines for accuracy stats but remove the others
		if (smart_compact_log) {

			// Object to store the data
			let smart_accuracy_reducing = {};

			//Now go through every necessary line
			for (let i = end_line; i > start_line; i--) {

				let line = lines[i];
				let parts = line.split(": ");

				if (parts.length > 1) {

					let logged_information = parts[1];
					// Check if the line matches with the events we want to minify
					if (smart_advanced_clearing.some((regex) => {
						return regex.test(logged_information);
					})) {

						// If our smart minifier doesn't keep track of it yet, add it as key
						if (!Object.prototype.hasOwnProperty.call(smart_accuracy_reducing, logged_information)) {
							smart_accuracy_reducing[logged_information] = {
								"amount": 0,
								"occurrences": []
							};
						}

						// Now save how many there are in total and where to find them
						smart_accuracy_reducing[logged_information].amount++;
						smart_accuracy_reducing[logged_information].occurrences.push(i);
					}
				}
			}

			// Later we will remove all unneeded lines, we will store them here
			let lines_to_be_removed = [];

			// Now for every type of shot done 
			for (let key in smart_accuracy_reducing) {

				// Only if there were any shots fired we need to handle it (because otherwise it would be handled twice)
				if (smart_advanced_clearing[1].test(key)) {

					// Reference to the same type but now all hit shtos
					let new_key = key.replace("shot_fired", "shot_hit");

					// If there were any shots hit with the weapon
					if (Object.prototype.hasOwnProperty.call(smart_accuracy_reducing, new_key)) {

						// Get the least needed for each type so we have a precision of 1 percent but only the least elements needed
						let data = reduce_smart_accuracy(smart_accuracy_reducing[new_key].amount, smart_accuracy_reducing[key].amount);

						// Add all lines which can be removed containing shots fired
						lines_to_be_removed = lines_to_be_removed.concat(smart_accuracy_reducing[key].occurrences.slice(data[1], smart_accuracy_reducing[key].occurrences.length));

						// Add all lines which can be removed containing shots hit
						lines_to_be_removed = lines_to_be_removed.concat(smart_accuracy_reducing[new_key].occurrences.slice(data[0], smart_accuracy_reducing[new_key].occurrences.length));

					}
					// If there were no hit shots with the weapon remove all fired events but one
					else {
						lines_to_be_removed = lines_to_be_removed.concat(smart_accuracy_reducing[key].occurrences.slice(1, smart_accuracy_reducing[key].occurrences.length));
					}
				}
			}

			// Now remove all the lines which we have added to the lines to be removed
			lines = lines.filter((_, index) => {
				return !lines_to_be_removed.includes(index);
			});

		}

		// Now remove all lines which are not between start line and end line and which contain non needed events
		lines = lines.filter((line, index) => {
			return index >= start_line && index <= end_line && !clear_regexes.some((regex) => {
				return regex.test(line);
			});
		});

		return out + lines.join("\n");

	}

	// Main function to combine all log files
	async function combine_log_files() {

		// Don't allow this function to trigger multiple times
		if (currently_uploading || Object.keys(logs_to_be_combined).length == 0) {
			return false;
		}

		//If we previously canceled an upload allow it again
		cancel_upload = false;

		// Show the settings container and reset it
		$(".combiner_upload_container").removeClass("hide");
		$(".upload_settings_container").removeClass("hide");
		// Disable the upload button because we first have to process data
		$(".finalize_upload").addClass("disabled");
		currently_uploading = true;

		// Create the variable in which information will be stored
		let log_data = {};
		// Step 1 is combining all the logs
		// Step 2 is adding custom log text
		// Step 3 is uploading the combined log
		let current_step = 0;
		let amount = Object.keys(logs_to_be_combined).length;
		total_combine_steps += 4 + 2 * amount;


		let map_array = [];

		// Get all the map names
		for (let log in logs_to_be_combined) {
			map_array.push(logs_to_be_combined[log]["map"]);
		}

		let map_string = map_array_to_map_name(map_array);

		// If a map name was found, set the form value to it, otherwise the user has to enter it himself
		$(".log_map").val(map_string);
		// Set a default title for the log
		$(".log_title").val("Combined Log");

		// For every log we want to combine we need to download them
		for (let log in logs_to_be_combined) {
			// Allow canceling mid downloading
			if (cancel_upload) return;

			// Update the progress bar
			current_step++;
			update_progress(current_step / total_combine_steps, "Downloading log id: " + log);
			// Download the log
			log_data[log] = await get_log_text(log);
		}

		// For every downloaded log extract the important information
		for (let log in log_data) {
			// Allow canceling mid processing
			if (cancel_upload) return;

			// Update the progress bar
			current_step++;
			update_progress(current_step / total_combine_steps, "Processing log id: " + log);
			// Process the log
			log_data[log] = process_log_file(log_data[log]);
		}

		// Update the progress bar
		current_step++;
		update_progress(current_step / total_combine_steps, "Combining all processed logs.");

		// The resulting combined text will be stored here
		log_file_data["text"] = "";

		// In chat display the combined log files, so we need to store their ids here
		let log_id_list = [];

		// Combine every log
		for (let log in log_data) {
			log_file_data["text"] += log_data[log];
			log_id_list.push("https://logs.tf/" + log);
		}
		// Allow canceling mid processing
		if (cancel_upload) return;
		// Update the progress bar
		current_step++;
		update_progress(current_step / total_combine_steps, "Adding log information to chat.");

		// Get a correct timestamp from the end of the log file
		let timestamp = log_file_data["text"].split("\n").slice(-2, -1)[0].substr(0, 25);

		// Add the information about the combined logs and the used software
		if (log_file_data["text"].charAt(log_file_data["text"].length - 1) != "\n") {
			log_file_data["text"] += "\n";
		}
		log_file_data["text"] += timestamp + " \"Jack's Log Combiner<0><Console><Console>\" say \"The following logs were combined: " + log_id_list.join(" & ") + "\"\n";
		log_file_data["text"] += timestamp + " \"Jack's Log Combiner<0><Console><Console>\" say \"The logs were combined using: " + github_url + "\"\n";

		// Tell the user we now wait for his input
		update_progress(current_step / total_combine_steps, "Waiting for user confirmation. - Total filesize: ");

		// Create a data object from the log file
		log_file_data["upload"] = new FormData();
		log_file_data["blob"] = new Blob([log_file_data["text"]], {
			type: "text/plain"
		});

		// Update the progress bar
		current_step++;

		// If the log size is over 10 MB already show a warning
		if (log_file_data["blob"].size > 10485780) {
			update_progress(current_step / total_combine_steps, "Waiting for user confirmation. - Total filesize: " + file_size(log_file_data["blob"].size) + " | THIS LOG WILL MOST LIKELY BE TOO BIG TO UPLOAD" + (smart_compact_log ? "" : " (try enabling the minify setting)"));
		} else {
			update_progress(current_step / total_combine_steps, "Waiting for user confirmation. - Total filesize: " + file_size(log_file_data["blob"].size));
		}

		// To the form add the file as upload
		// Add the information about the combined logs and the used software
		log_file_data["upload"].append("logfile", log_file_data["blob"], "combined.log");
		log_file_data["uploader"] = "Jacks On-Page Log Combiner v" + version;

		// Now allow the user to upload the combined log
		$(".finalize_upload").removeClass("disabled");
	}

	// | Used Helper Functions | ---------------------------------------------------------------------------------------

	// Code to enable a button it is used multiple times so it is put into its own function
	function enable_button(element) {
		element.text("+");
		element.removeClass("btn-danger");
		element.addClass("btn-success");
	}

	// Code to disable a button it is used multiple times so it is put into its own function
	function disable_button(element) {
		element.text("-");
		element.removeClass("btn-success");
		element.addClass("btn-danger");
	}


	// Function to update the progress bar and display a status message
	function update_progress(progress, step_message) {

		// Allow the percentage to remain unchanged
		if (progress > 0) {
			let percent = Math.round(progress * 100) + "%";

			$(".progress_number").text(percent);
			$(".progress").css("width", percent);

			// If it was either successful or failed close the popup again and allow opening it again
			if (progress == 1) {
				$(".upload_settings_container").addClass("hide");
				$(".upload_close_container").removeClass("hide");
				currently_uploading = false;
			}
		}

		$(".progress_current_step").text(step_message);

	}

	// Convert a byte number into a better readable file size
	function file_size(file_size) {
		const i = Math.floor(Math.log(file_size) / Math.log(1024));
		return (file_size / Math.pow(1024, i)).toFixed(2) + " " + "0kMGT".charAt(i) + "B";
	}

	// Based on https://stackoverflow.com/a/4652513
	// Get the smallest possible number for the percentage
	function reduce_smart_accuracy(bottom, top) {

		// Don't allow precision higher than 1 percent
		if (top > 100) {
			bottom = Math.round(bottom / top * 100);
			top = 100;
		}

		let reduce = (a, b) => {
			return b ? reduce(b, a % b) : a;
		};
		let gcd = reduce(bottom, top);
		return [bottom / gcd, top / gcd];
	}

	// Return a map name for an Array of maps
	function map_array_to_map_name(array){
		// Getting the map name
		let map_set = new Set();
		let map_string = "";

		// Get all the map names
		for (let map in array) {
			map_set.add(array[map]);
		}

		// Convert the Set to an array for easier working
		map_set = Array.from(map_set);

		// Function to try to find a map name
		// Try to join the entire map name with " + "
		if (map_set.join(" + ").length < 25) {
			map_string = map_set.join(" + ");
		}
		// Try to join the entire map name with ","
		else if (map_set.join(",").length < 25) {
			map_string = map_set.join(",");
		}
		// The map name won't fit, so try to shorten the map names
		else {

			// Try to extract the "important" part of all map names (f.e. process for cp_process_final)
			let new_map_list = map_set.map((map) => map.split("_")[1]);

			// Now try to join them like above
			if (new_map_list.join(" + ").length < 25) {
				map_string = new_map_list.join(" + ");
			} else if (new_map_list.join(",").length < 25) {
				map_string = new_map_list.join(",");
			}
		}

		return map_string;
	}

	// | Event Handlers | ----------------------------------------------------------------------------------------------

	// The userscript would run at document load, but if this script is used as a standalone we need to wait ourself to attach events


	function setup() {

		// If the cancel button is clicked in the sidebar remove all logs and reset them to their default style
		$("#cancel_combine").click(clear_current_logs);

		// On clicking combine logs start the combine logs process
		$("#combine_logs").click(combine_log_files);

		// Allow closing the modal after being finished
		$(".close_upload").click(() => {
			$(".combiner_upload_container").addClass("hide");
			$(".upload_settings_container").removeClass("hide");
			$(".upload_close_container").addClass("hide");
		});

		// When clicking a add log button in the list toggle between the plus sign and the minus sign and add or remove it from the log list
		$(".log_add_button").click((event) => {

			let element = $(event.currentTarget);
			let current_id = parseInt($(element.parents()[1]).attr("id").split("_")[1]);

			// If log is not added yet, add it to the log list
			if (!Object.prototype.hasOwnProperty.call(logs_to_be_combined, current_id)) {
				// On the uploads page the text is in inputs, so we need special handling for them
				// Text version
				if (location.pathname.split("/").pop() != "uploads") {
					logs_to_be_combined[current_id] = {
						id: current_id,
						name: element.next().text(),
						map: element.parent().next().text()
					};
				}
				// Input version
				else {
					logs_to_be_combined[current_id] = {
						id: current_id,
						name: element.next().val(),
						map: $(element.parent().next().children()[0]).val()
					};
				}
			} else {
				// If the log is already added remove it from the list and reset the style
				delete logs_to_be_combined[current_id];
				enable_button($(`#log_${current_id} .log_add_button`));
			}

			// Update the global log list (styling and the sidebar)
			updateToBeCombinedLogList();
		});

		// Handling the button which is on a single log page
		$(".log_add_button_on_log_page").click(() => {

			let current_id = parseInt(location.pathname.split("/")[1]);

			// If log is not added yet, add it to the log list
			if (!Object.prototype.hasOwnProperty.call(logs_to_be_combined, current_id)) {
				logs_to_be_combined[current_id] = {
					id: current_id,
					name: $("#log-name").text(),
					map: $("#log-map").text()
				};
			} else {
				// If the log is already added remove it from the list and reset the style
				delete logs_to_be_combined[current_id];
				enable_button($(".log_add_button_on_log_page"));
			}

			// Update the global log list (styling and the sidebar)
			updateToBeCombinedLogList();
		});

		// On clicking the cancel upload cancel it
		$(".cancel_upload").click(() => {
			cancel_upload = true;
			currently_uploading = false;
			$(".combiner_upload_container").addClass("hide");
		});

		// When clicking the upload button finally upload the combined log
		$(".finalize_upload").click((e) => {
			// Only allow the click event if the button is not disabled
			if (!$(e.currentTarget).hasClass("disabled")) {


				// Prevent the button from being pressed again
				$(".finalize_upload").addClass("disabled");

				update_progress(-1, "Currently uploading the file...");

				// If the user is not logged in but we have an api key upload files using the api key
				let key_string = (!is_logged_in && api_key != "") ? "&key=" + encodeURIComponent(api_key) : "";

				// Send the request with the data
				fetch(location.protocol + "//logs.tf/upload?title=" + encodeURIComponent($(".log_title").val()) + "&map=" + encodeURIComponent($(".log_map").val()) + "&uploader=" + encodeURIComponent(log_file_data["uploader"]) + "&logfile=combined.log" + key_string, {
					"body": log_file_data["upload"],
					"method": "POST",
				}).then(response => {
					if (response.ok) {
						return response.json();
					} else if (response.status == 413) {
						throw ("Error 413 - Log was too big to upload. Do you have the minifying option enabled?");
					} else {
						throw ("Status Code Error " + response.status + " - " + response.statusText);
					}

				})
					// The resulting JSON data
					.then(data => {
						if (data.success) {
							update_progress(1, "Successfully uploaded the log");
							// Because it was successful clear the current logs
							clear_current_logs();
							GM_openInTab("https://logs.tf/" + data.log_id, { "active": true, "insert": true, "setParent": true });
						} else {
							update_progress(1, "Following error was displayed during log upload: " + data.error);
						}
					})
					// When an error happened during the request
					.catch(err => {
						update_progress(1, "An error happened on the request. -" + err);
					});
			}
		});

		// When clicking the Log combiner link in the footer, open the settings menu and apply the current options
		$(".log_combiner_open_settings").click(e => {
			e.preventDefault();
			e.stopPropagation();

			let settings_menu = $(".combiner_global_settings_container");

			if (settings_menu.hasClass("hide")) {
				$(".combiner_api_key").val(api_key);
				$(".combiner_minify")[0].checked = smart_compact_log;

				settings_menu.removeClass("hide");
			}

		});

		// When clicking cancel in the settings just hide the menu again
		$(".cancel_settings").click(() => {
			$(".combiner_global_settings_container").addClass("hide");
		});

		// When clicking save in the settings get and apply the new settings and then hide the menu again
		$(".save_combiner_settings").click(() => {
			api_key = $(".combiner_api_key").val();
			smart_compact_log = $(".combiner_minify")[0].checked;

			GM_setValue("api_key", api_key);
			GM_setValue("smart_compact_log", smart_compact_log);

			$(".combiner_global_settings_container").addClass("hide");
		});


		// When clicking the combine zip link in the settings menu, open the menu for that
		$(".upload_zip").click(e => {
			e.preventDefault();
			e.stopPropagation();

			let settings_menu = $(".combiner_global_settings_container");
			let zip_upload_menu = $(".combiner_upload_zip_container");

			// Hide and show the correct stuff, reset to default values
			settings_menu.addClass("hide");
			zip_upload_menu.removeClass("hide");
			$(".zip_file_url").val("");
			$(".zip_combine")[0].checked = false;
			$(".zip_upload_status").text("Waiting for Fetch.");
		});

		$(".zip_upload_interact").click(async (e) => {
			// If we are not currently trying an upload
			if (!$(e.currentTarget).hasClass("disabled")) {

				// Get the URL and validate it
				let url;
				try {
					url = new URL($(".zip_file_url").val());
				} catch (error) {
					$(".zip_upload_status").html("<div style='color:red;'>Invalid URL.</div>");
					return;
				}

				// Disable the button
				$(".zip_upload_interact").addClass("disabled");
				$(".zip_upload_status").html("<div class='loadingdots'>Fetching Zip Archive</div>");

				// Use Tampermonkey Request to bypass CORS
				let response;
				try {
					response = (await new Promise((resolve, reject) => {
						GM_xmlhttpRequest({
							method: "GET",
							url: url.toString(),
							responseType: "blob",
							onload: resolve,
							onerror: reject,
							onabort: reject,
							ontimeout: reject
						});
					})).response;
				} catch (error) {
					$(".zip_upload_status").html("<div style='color:red;'>Web Request for the Zip Failed</div>");
					$(".zip_upload_interact").removeClass("disabled");
					return;
				}

				let files = {};
				$(".zip_upload_status").html("<div class='loadingdots'>Loading Zip file</div>");
				try {

					// Load the zip and extract every .log file
					let zip_file = await JSZip.loadAsync(response);

					for (let file in zip_file.files) {
						let name = zip_file.files[file].name;
						if(name.endsWith(".log")){
							$(".zip_upload_status").html("<div class='loadingdots'>Extracting " + name + "</div>");
							files[name] = await zip_file.files[file].async("text");
						}
					}
				} catch (error) {
					$(".zip_upload_status").html("<div style='color:red;'>Failed Parsing Zip - is it a valid zip?</div>");
					$(".zip_upload_interact").removeClass("disabled");
					return;
				}

				if(Object.keys(files).length == 0){
					$(".zip_upload_status").html("<div style='color:red;'>Zip didn't contain any logs.</div>");
					$(".zip_upload_interact").removeClass("disabled");
					return;
				} 


				$(".zip_upload_status").html("<div class='loadingdots'>Parsing Log Files</div>");

				// Sort logs by file name, because the oldest log will then be first
				let logs = Object.keys(files).sort();

				let map_name_regex = /^L \d\d\/\d\d\/\d\d\d\d - \d\d:\d\d:\d\d: Loading map "([0-9a-zA-Z_\-.]+)"$/m;
				let log_has_tournament = /Tournament mode started/;

				let new_map = false;
				let map_name = "";

				let games = [];

				for (let i in logs) {
					let log = files[logs[i]];
					$(".zip_upload_status").html("<div class='loadingdots'>Parsing Log Files - "+logs[i]+"</div>");
					let size = (new TextEncoder().encode(log)).length;

					// Have a minimum size to ignore unimportant logs
					if (size > 5000) {

						// A bit redundant to be honest
						if(new_map){
							// If the match has a started tournament round save it is a single log
							if (log.match(log_has_tournament)){
								games.push({
									"map": map_name, 
									"file_name": ((url.host == "serveme.tf") ? "serveme.tf #" + url.pathname.split("-")[1] : logs[i]) + " - #" +(games.length+1),
									"log": process_log_file(log)
								});
							}
						}

						// Extract the new map name
						let match = log.match(map_name_regex);
						if(match != null){
							new_map = true;
							map_name = match[1];
						}
					}
				}

				// If the logs should be combined, reduce the games array into a single games object
				if ($(".zip_combine")[0].checked){

					let map_name = map_array_to_map_name(games.map(game => game.map));
					let title = "";
					if (url.host == "serveme.tf")
						title = "serveme.tf #" + url.pathname.split("-")[1];
					else title = games.reduce((total, cur) => { return total.file_name + " + " + cur.file_name; });

					let logs = games.reduce((total, cur) => { return total.log + cur.log;});
					games = [{
						map: map_name,
						file_name: title,
						log: logs
					}];
				}

				let any_errors = false;
				let i = 1;

				// For every game object upload a log
				games.forEach(game => {

					if(any_errors){
						return;
					}

					$(".zip_upload_status").html("<div class='loadingdots'>Uploading Game #" + i + "</div>");

					// Get a correct timestamp from the end of the log file
					let timestamp = game.log.split("\n").slice(-2, -1)[0].substr(0, 25);

					// Add the information about the combined logs and the used software
					if (game.log.charAt(game.log.length - 1) != "\n") {
						game.log += "\n";
					}

					if (url.host == "serveme.tf")
						game.log += timestamp + " \"Jack's Log Combiner<0><Console><Console>\" say \"The Serveme.tf Reservation was uploaded: #" + url.pathname.split("-")[1] + "\"\n";
					game.log += timestamp + " \"Jack's Log Combiner<0><Console><Console>\" say \"The logs were uploaded from a zip using: " + github_url + "\"\n";


					// Create a data object from the log file
					let upload = new FormData();
					let data_blob = new Blob([game.log], {
						type: "text/plain"
					});

					// To the form add the file as upload
					// Add the information about the combined logs and the used software
					upload.append("logfile", data_blob, "combined.log");
					let uploader = "Jacks On-Page Log Combiner v" + version;


					// If the user is not logged in but we have an api key upload files using the api key
					let key_string = (!is_logged_in && api_key != "") ? "&key=" + encodeURIComponent(api_key) : "";

					// Send the request with the data
					fetch(location.protocol + "//logs.tf/upload?title=" + encodeURIComponent(game.file_name) + "&map=" + encodeURIComponent(game.map) + "&uploader=" + encodeURIComponent(uploader) + "&logfile=combined.log" + key_string, {
						"body": upload,
						"method": "POST",
					}).then(response => {
						if (response.ok) {
							return response.json();
						} else if (response.status == 413) {
							throw ("Error 413 - Log was too big to upload. Do you have the minifying option enabled?");
						} else {
							throw ("Status Code Error " + response.status + " - " + response.statusText);
						}

					})
						// The resulting JSON data
						.then(data => {
							if (data.success) {
								// Because it was successful clear the current logs
								clear_current_logs();
								GM_openInTab("https://logs.tf/" + data.log_id, { "active": true, "insert": true, "setParent": true });
							} else {
								$(".zip_upload_status").html("<div style='color:red;'>Following error was displayed during log upload: " + data.error +"</div>");
								any_errors = true;
								return;
							}
						})
						// When an error happened during the request
						.catch(err => {
							$(".zip_upload_status").html("<div style='color:red;'>An error happened on the request. - " + err + "</div>");
							any_errors = true;
							return;
						});
					
					i++;

				});

				// Upload is either successfull now or failed, so we can reenable the button
				$(".zip_upload_interact").removeClass("disabled");

				if (!any_errors) {
					$(".zip_upload_status").text("Uploads successful");
				}
			}
		});

		// When clicking cancel in the zip upload just hide the menu again
		$(".cancel_zip").click(() => {
			$(".combiner_upload_zip_container").addClass("hide");
		});


		// Load the logs saved in the variable (so it works across sites)
		updateToBeCombinedLogList();
	}

	// Page is already ready
	if (document.readyState == "complete" || document.readyState == "interactive") {
		setup();
		// We have to wait for the page to be ready
	} else {
		// Check every 50 ms if the site is loaded now
		let wait_for_load_interval = setInterval(() => {
			if (document.readyState == "complete" || document.readyState == "interactive") {
				console.log("Document loaded");
				setup();
				// Stop checking for the load
				clearInterval(wait_for_load_interval);
			}
		}, 50);
	}


})();