// ==UserScript==
// @name         Jacks Log Combiner
// @namespace    https://github.com/NetroScript/
// @version      0.1.5
// @description  Allows you to combine logs on logs.tf directly on the page.
// @author       NetroScript
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.2.2/jszip.min.js
// @match        http://logs.tf/*
// @match        https://logs.tf/*
// @run-at       document-end
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @downloadURL  https://github.com/NetroScript/Jacks-LogsTF-On-Page-Combiner/raw/master/Jacks-LogsTF-On-Page-Combiner.user.js
// @updateURL    https://github.com/NetroScript/Jacks-LogsTF-On-Page-Combiner/raw/master/Jacks-LogsTF-On-Page-Combiner.meta.js
// ==/UserScript==

(function () {
	"use strict";

	const version = "0.1.5";
	const github_url = "https://github.com/NetroScript/Jacks-LogsTF-On-Page-Combiner/";

	$(".container.footer .nav").append(`<li style="float:right"><a href="${github_url}" class="log_combiner_open_settings">Jack's Log Combiner v${version} is installed</a></li>`);


	let api_key = GM_getValue("api_key", "");
	let advanced_compact_log = GM_getValue("advanced_compact_log", false);

	let is_logged_in = true;

	if ($("[alt='Sign in through Steam']").length > 0) {
		is_logged_in = false;

		if(api_key != "" && api_key != "None"){
			console.log("User is not logged in, but we have an API key saved, so we will contineu");
		} else {
			console.log("User is not logged in, the user script will do nothing c:");
			return;
		}

	}

	// No API key is defined but the user is logged in, so we get the API key
	if(api_key == "" || api_key == "None"){
		fetch(location.protocol+"//logs.tf/uploader").then((response)=>{return response.text();}).then(async (text)=>{
			api_key = text.split("id=\"apikey\">")[1].split("</span")[0];
			if (api_key == "None"){
				let token = text.split("/createkey?t=")[1].split("',")[0];
				// eslint-disable-next-line require-atomic-updates
				api_key = await (await fetch(location.protocol+"//logs.tf/createkey?t="+token, {"referrer": location.protocol+"//logs.tf/uploader", "method": "GET", "mode": "cors"})).text();
			}
			GM_setValue("api_key", api_key);
		});
	}

	let logs_to_be_combined = JSON.parse(GM_getValue("to_be_combined", "{}"));

	let log_file_data = {};
	let total_combine_steps = 0;
	let cancel_upload = false;
	let currently_uploading = false;

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

.combiner_upload_container, .combiner_global_settings_container {
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

.combiner_upload_container input, .combiner_global_settings_container input {
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

	const settings_container = `<div class="combiner_global_settings_container hide">
	<h2>Log Combiner Settings</h2>
	<div class="spacer"></div>
    <a href="${github_url}">View the Github page</a>
	<div class="spacer"></div>
	<div class="_settings_container">
		<h4>API Key</h4>
		<input class="combiner_api_key" type="text" placeholder="Enter a custom API key">
		<h4>Further minify the log</h4><h6>When enabled you lose the accuracy stat</h6>
		<input class="combiner_minify" type="checkbox" name="log_map" placeholder="Enter a mapname" maxlength="24">
		<div class="button_container">
			<div class="btn btn-success save_combiner_settings">Save and close</div>
			<div class="btn btn-danger cancel_settings">Cancel</div>
		</div>
	</div>
	
</div>`;

	// Add our custom CSS and elements to the DOM
	$("head").append(custom_css);
	$("body").append(combiner_container);
	$("body").append(upload_container);
	$("body").append(settings_container);
	$("[id^=log_]>td:first-child").prepend("<div class=\"btn btn-success log_add_button\">+</div>");
	$(".log-header-left").prepend("<div class=\"btn btn-success log_add_button_on_log_page\">+</div>");

	// When clicking a add log button in the list toggle between the plus sign and the minus sign and add or remove it from the log list
	$(".log_add_button").click((event) => {

		let element = $(event.currentTarget);
		let current_id = parseInt($(element.parents()[1]).attr("id").split("_")[1]);

		// If log is not added yet, add it to the log list
		if (!Object.prototype.hasOwnProperty.call(logs_to_be_combined, current_id)) {
			// On the uploads page the text is in inputs, so we need special handling for them
			// Text version
			if(location.pathname.split("/").pop() != "uploads"){
				logs_to_be_combined[current_id] = {
					id: current_id,
					name: element.next().text(),
					map: element.parent().next().text()
				};
			// Input version
			} else {
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

	// Code to enable a button it is used multiple times so it is put into its own function
	function enable_button(element){
		element.text("+");
		element.removeClass("btn-danger");
		element.addClass("btn-success");
	}

	// Code to disable a button it is used multiple times so it is put into its own function
	function disable_button(element){
		element.text("-");
		element.removeClass("btn-success");
		element.addClass("btn-danger");
	}

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
			if("/"+log == location.pathname){
				disable_button($(".log_add_button_on_log_page"));
			}

			$(".combiner_container .entries").append(`<tr id="${logdata.id}">
<td class="title">${logdata.name}</td>
<td class="map">${logdata.map}</td>
</tr>`);

		}

	}

	// Helper function to clear all the saved logs
	function clear_current_logs(){

		for (let log in logs_to_be_combined) {
			enable_button($(`#log_${log} .log_add_button`));
			if("/"+log == location.pathname){
				enable_button($(".log_add_button_on_log_page"));
			}
		}

		logs_to_be_combined = {};
		updateToBeCombinedLogList();
	}

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

	// Get the log content from a log ID
	async function get_log_text(log_id) {
		let log = "";
		let response = await fetch(location.protocol+"//logs.tf/logs/log_" + log_id + ".log.zip", { method: "GET" });
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
		let out = lines[0]+"\n";

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
			/triggered "shot_hit"/,
			/triggered "shot_fired"/
		];

		if(!advanced_compact_log){
			clear_regexes = [];
		}

		// Now remove all lines which are not between start line and end line or which contain shot_hit or shot_fired events
		lines = lines.filter((line, index) => {
			return index >= start_line && index <= end_line && !clear_regexes.some((regex) => {return line.match(regex);});
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
		total_combine_steps = 4;
		let current_step = 0;
		let amount = Object.keys(logs_to_be_combined).length;

		total_combine_steps += 2 * amount;


		// Getting the map name
		let map_set = new Set();
		let map_string = "";

		// Get all the map names
		for (let log in logs_to_be_combined) {
			map_set.add(logs_to_be_combined[log]["map"]);
		}

		// Convert the Set to an array for easier working
		map_set = Array.from(map_set);

		// Function to try to find a map name
		// Try to join the entire map name with " + "
		if (map_set.join(" + ").length < 25) {
			map_string = map_set.join(" + ");
		// Try to join the entire map name with ","
		} else if (map_set.join(",").length < 25) {
			map_string = map_set.join(",");
		// The map name won't fit, so try to shorten the map names
		} else {
			let new_map_list = [];
			// Try to extract the "important" part of all map names (f.e. process for cp_process_final)
			map_set.forEach(map => {
				let parts = map.split("_");
				if (parts.length == 2) {
					new_map_list.push(parts[1]);
				} else {
					new_map_list.push(parts.slice(-2, -1)[0]);
				}
			});
			// Now try to join them like above
			if (new_map_list.join(" + ").length < 25) {
				map_string = new_map_list.join(" + ");
			} else if (new_map_list.join(",").length < 25) {
				map_string = new_map_list.join(",");
			}

		}

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
		if (log_file_data["text"].charAt(log_file_data["text"].length-1) != "\n"){
			log_file_data["text"] += "\n";
		}
		log_file_data["text"] += timestamp + " \"Jack's Log Combiner<0><Console><Console>\" say \"The following logs were combined: " + log_id_list.join(" & ") + "\"\n";
		log_file_data["text"] += timestamp + " \"Jack's Log Combiner<0><Console><Console>\" say \"The logs were combined using: "+github_url+"\"\n";

		// Tell the user we now wait for his input
		update_progress(current_step / total_combine_steps, "Waiting for user confirmation. - Total filesize: ");

		// Create a data object from the log file
		log_file_data["upload"] = new FormData();
		log_file_data["blob"] = new Blob([log_file_data["text"]], { type: "text/plain" });

		// Update the progress bar
		current_step++;
		update_progress(current_step / total_combine_steps, "Waiting for user confirmation. - Total filesize: " + file_size(log_file_data["blob"].size));

		// To the form add the file as upload
		// Add the information about the combined logs and the used software
		log_file_data["upload"].append("logfile", log_file_data["blob"], "combined.log");
		log_file_data["uploader"] =  "Jacks On-Page Log Combiner v"+version;

		// Now allow the user to upload the combined log
		$(".finalize_upload").removeClass("disabled");
	}


	// Function to update the progress bar and display a status message
	function update_progress(progress, step_message) {


		// Allow the percentage to remain unchanged
		if (progress > 0){
			let percent = Math.round(progress * 100) + "%";

			$(".progress_number").text(percent);
			$(".progress").css("width", percent);

			// If it was either successful or failed close the popup again and allow opening it again
			if(progress == 1){
				$(".upload_settings_container").addClass("hide");
				$(".upload_close_container").removeClass("hide");
				currently_uploading = false;
			}
		}
	
		$(".progress_current_step").text(step_message);

	}

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
			let key_string = (!is_logged_in && api_key != "") ? "&key="+encodeURIComponent(api_key) : "";

			// Send the request with the data
			fetch(location.protocol + "//logs.tf/upload?title=" + encodeURIComponent($(".log_title").val()) + "&map=" + encodeURIComponent($(".log_map").val()) + "&uploader=" + encodeURIComponent(log_file_data["uploader"]) + "&logfile=combined.log"+key_string, {
				"body": log_file_data["upload"],
				"method": "POST",
			}).then(response => {
				return response.json();
			})
				// The resulting JSON data
				.then(data => {
					if(data.success){
						update_progress(1, "Successfully uploaded the log");
						clear_current_logs();
						window.open("https://logs.tf/" + data.log_id,"_blank");
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

		if(settings_menu.hasClass("hide")){
			$(".combiner_api_key").val(api_key);
			$(".combiner_minify")[0].checked = advanced_compact_log;

			settings_menu.removeClass("hide");
		}

	});

	$(".cancel_settings").click(()=>{
		$(".combiner_global_settings_container").addClass("hide");
	});

	$(".save_combiner_settings").click(()=>{
		api_key = $(".combiner_api_key").val();
		advanced_compact_log = $(".combiner_minify")[0].checked;

		GM_setValue("api_key", api_key);
		GM_getValue("advanced_compact_log", advanced_compact_log);

		$(".combiner_global_settings_container").addClass("hide");
	});

	// Load the logs saved in the variable (so it works across sites)
	updateToBeCombinedLogList();


	// Convert a byte number into a better readable file size
	function file_size(file_size) {
		const i = Math.floor(Math.log(file_size) / Math.log(1024));
		return (file_size / Math.pow(1024, i)).toFixed(2) + " " + "0kMGT".charAt(i) + "B";
	}


})();