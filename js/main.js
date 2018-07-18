"use strict";
// Holds recipes pulled from the jquery
var recipes = [];
var JSON_URL = "https://api.myjson.com/bins/nh48u";
var timer = [];
var timer_interval;

// Following just adds jquery event listeners on search bar elements.
$(document).ready(function () {
    // This pulls data to populate website with recipes
    $.getJSON(JSON_URL, function (data) {
        var tmp = [];
        $.each(data, function (k, v) {
            tmp.push(v);
        });
        recipes = tmp;
    });

    //Pretty much every time the user enters a new keyvalue
    $("#search_recipe").on("keyup", function () {
        searchChanged();
    });

    // When the user changes the keyword category
    $("#search_category", "#search_recipe").on("change", function () {
        searchChanged();
    });

    // When the user clicks on the search button
    $("#btn_search").on("click", function () {
        searchChanged();
    });
});

function searchChanged() {
    // Gets the search query values such as the input and the selected keyword category
    var category = $("#search_category").val().toLowerCase().replace(/\s+/g, '');
    var keywords = $("#search_recipe").val().toLowerCase().replace(/\s+/g, '').split(",");
    // Update the query results
    setSearchResult(keywords, category);
}

function displayInfo(id) {
    // Populates the recipe summary modal with necessary information
    document.getElementById("recipeInfoName").innerHTML = recipes[id].name;
    document.getElementById("recipeInfoImg").src = recipes[id].image;
    var ingredients = recipes[id].ingredients;
    var tmp = "";
    var i;
    for (i in ingredients) {
        tmp += '<li>{amount} {item}</li>'.replace("{item}", ingredients[i].name).replace("{amount}", replaceFractions(ingredients[i].amount));
    }
    document.getElementById("recipeInfoIng").innerHTML = '<p>In order to cook this recipe, you will need the following ingredients:</p><ul>' + tmp + '</ul>';
    document.getElementById("recipeInfoDur").innerHTML = "Estimated duration: " + recipes[id].duration + " minutes";
    $("#recipeInfo").modal();
    $("#btn_startCooking").on("click", function () {
        document.getElementById("btn_startCooking").onclick = startCooking(id);
    })
}

function setSearchResult(keywords, category) {
    // Behemoth that completes the query.
    // temp value to store "cleaned" string
    var tmp;
    // temp list to hold recipes that match the query
    var meeting_recipes = [];
    // Temporary value to hold the keyword to check (keyword without the '!' chars at the front if they were entered)
    var keyword;
    // temp variable to store if the keyword was found
    var found;
    // Wether all the conditions entered by the user are valid
    var all_valid;
    // regex used to get the '!' chars from the start of a string. (This allows multiple negation)
    var reg = /^[!]+/;
    // temp variable to hold the results of the regex
    var test;
    // temp variable to make working with sub-arrays easier
    var ingredients;
    // temp variable to hold if the current keyword is a not_keyword
    var not_keyword;

    // Looping through recipes first since you only want to check all of those values once
    var i, j, k;
    for (j in recipes) {
        // Assume that all the keywords are valid from the start.
        all_valid = true;
        for (i in keywords) {
            keyword = keywords[i];
            // get all the consecutive '!' at the start of the keyword
            test = reg.exec(keyword);
            tmp = "";

            // if test is not null, we know there's at least 1 '!', making it a possible not keyword.
            if (test != null) {
                // get the string value extracted
                test = test[0];
                // If if there's an even amount of '!' we know they all negate eachother
                not_keyword = (test.length % 2) != 0;
                // Set the temp keyword to the original and remove all characters meeting the regex condition
                keyword = keywords[i].replace(reg, '');
            } else {
                // Don't need to worry about not keywords, just use the entered keyword
                not_keyword = false;
                keyword = keywords[i]
            }
            // If following is true, we don't want to update query. Pretty much checks if empty or recipe value undefined and not any category
            if ((recipes[j][category] == undefined || keyword.length == 0) && category != "any") continue;

            if (category == "ingredients") {
                // Since ingredients are stored in an array of objects, we need to go through all of them
                ingredients = recipes[j][category];
                // We only search for the name, and if the name is found or shouldn't be there

                for (k in ingredients) {
                    tmp += ingredients[k].name.toLowerCase().replace(/\s+/g, '');
                }
            } else if (category == "any") {
                tmp = recipes[j].name + recipes[j].duration + "minutes";
                for (k in recipes[j].ingredients) {
                    tmp += recipes[j].ingredients[k].name;
                }
                tmp = tmp.toLowerCase().replace(/\s+/g, '');
            } else {
                // Otherwise just get the value from directly accessing it by its key name
                tmp = recipes[j][category].toLowerCase().replace(/\s+/g, '');
            }
            found = tmp.indexOf(keyword) != -1;
            
            // logic here is that you can't have something that found and not found (if found and supposed to not be found then false, don't really care about the rest)
            if (found == not_keyword) all_valid = false;

            // If all the keywords are invalid, remove the recipe otherwise add it. Only try to add/remove if it's not/already in the array.    
            if (!all_valid) {
                if (meeting_recipes.indexOf(recipes[j]) != -1) meeting_recipes.pop(recipes[j]);
                // break keywords loop and move on to next recipe
            } else {
                if (meeting_recipes.indexOf(recipes[j]) == -1) meeting_recipes.push(recipes[j]);
            }
        }
    }

    // Hold the result container DOM
    var result_container = document.getElementById("search_result_container");
    if (document.getElementById("search_recipe").value == "") {
        // If query is empty, put in empty table (This is done if the user removes his input, otherwise it would remain as the past one).
        result_container.innerHTML = '<table class="table table-hover"><thead><tr class="d-flex"><th class="col-9">Name</th><th class="col-3">Duration</th></tr></thead><tbody id="search_results"></tbody></table>';
        return;
    } else if (meeting_recipes.length == 0) {
        // Give error instead of table if there's no results
        result_container.innerHTML = '<div class="alert alert-danger alert-dismissible shadow-sm"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>No result found!</strong> Unfortunately there were no recipes found meeting the specified criteria.</div>'
        return;
    }
    // Set the inner DOM of the results to the table
    result_container.innerHTML = '<table class="table table-hover"><thead><tr class="d-flex"><th class="col-9">Name</th><th class="col-3">Duration</th></tr></thead><tbody id="search_results"></tbody></table>';
    // Basic template for the query result table
    var template = '<tr class="d-flex" onclick="displayInfo({id});"><th class="col-9">{name}</th><th class="col-3">{duration} minutes</th></tr>';
    // reuse the tmp value
    tmp = "";

    // Add all recipes obtained by the query
    for (i in meeting_recipes) {
        tmp += template.replace("{name}", meeting_recipes[i].name).replace("{duration}", meeting_recipes[i].duration).replace("{id}", meeting_recipes[i].id);
    }

    // add it to the container
    document.getElementById("search_results").innerHTML = tmp;
}

function startCooking(recipeId) {
    // Store the selected recipe id in the locaStorage
    localStorage.setItem("recipeId", recipeId);
    // Switch to the recipe page
    window.location = "recipe.html";
}

function generateRecipePage() {
    // pretty much just puts fills the recipe.html page with the recipe data.
    $.getJSON(JSON_URL, function (data) {
        var tmp = [];
        $.each(data, function (k, v) {
            tmp.push(v);
        });
        recipes = tmp;
        var id = localStorage.getItem("recipeId");
        var inst = document.getElementById("instructions_container");
        var steps = recipes[id].steps;
        tmp = '<div class="form-group">';
        var i;
        var tmp_id;
        for (i in steps) {
            tmp_id = "instruction-" + i;
            tmp += '<div class="checkbox"><label for="{instructionIndex}"><input name="Instruction" id="{instructionIndex}" type="checkbox" value=""> {instruction}</label>'.replace("{instructionIndex}", tmp_id).replace("{instructionIndex}", tmp_id).replace("{instruction}", steps[i].instruction);
            if (steps[i].type == "timer") {
                var timer_id = timer.length;
                timer.push({
                    "id": timer_id,
                    "time": steps[i].time * 60,
                    "time_left": -1
                });
                tmp += '<div class="row py-0"><button class="btn btn-success mx-auto" title="Click this button to start a timer for the duration of this step." onclick="waitStep({time}, this);"><i class="fa fa-play"></i> Start Timer</button></div>'.replace("{time}", timer_id);
            }
            tmp += "</div>";

        }
        inst.innerHTML = tmp + "</div>";

        var ing = document.getElementById("ingredients_container");
        var ingredients = recipes[id].ingredients;
        tmp = '<div class="form-group">';
        for (i in ingredients) {
            tmp_id = "ingredient-" + i;
            tmp += '<div class="checkbox"><label for="{ingredientIndex}"><input name="Ingredient" id="{ingredientIndex}" type="checkbox" value=""> {amount} {ingredient}</label></div>'.replace("{ingredient}", ingredients[i].name).replace("{amount}", replaceFractions(ingredients[i].amount)).replace("{ingredientIndex}", tmp_id).replace("{ingredientIndex}", tmp_id);
        }
        ing.innerHTML = tmp + "</div>";
    });
}

function waitStep(timer_id, button) {
    // This just updates the timer modal and makes the timer functional
    // Disable the button so multiple timers aren't started
    button.disabled = true;
    // Turn minute wait time into s (m * 60s/min). Select between previously saved time if it's != -1, otherwise use default
    var time_left = timer[timer_id].time_left == -1 ? timer[timer_id].time : timer[timer_id].time_left;
    var minutes = document.getElementById("timer_minutes");
    var seconds = document.getElementById("timer_seconds");

    minutes.innerHTML = parseInt(time_left / 60);
    seconds.innerHTML = ("0" + (time_left % 60)).slice(-2);

    $("#timerModal").modal();
    // Set interval between running the steps inside the function
    timer_interval = setInterval(function () {
        // Sets minutes
        minutes.innerHTML = parseInt(--time_left / 60);
        // Sets seconds
        seconds.innerHTML = ("0" + (time_left % 60)).slice(-2);
        // If the timer is done
        if (time_left == 0) {
            // Stop the interval
            clearInterval(timer_interval);
            // Inform the user the timer has completed
            alert("The timer has completed.");
            // Close the modal
            $("#timerModal").modal();
            // Reset the time left to -1 (So it if a previously saved time remains it is not used next time)
            timer[timer_id].time_left = -1;
            // Enable the timer button
            button.disabled = false;
        }
    }, 1000);
    // Remove all event listeners on the close and exit buttons
    $("#timer_close, #timer_exit").off("click");
    // Add new event listener onto it
    $("#timer_close, #timer_exit").on("click", function () {
        // Stop timer
        clearInterval(timer_interval);
        // Ask user if they wish to save the remaining time
        var keep_time = confirm("You have closed the timer, would you like to continue from this time when restarting the timer?");
        // If so save it, otherwise reset time_left to -1
        if (keep_time && time_left != 0) timer[timer_id].time_left = time_left;
        else timer[timer_id].time_left = -1;
        // Enable start timer button
        button.disabled = false;
    });
}

function replaceFractions(to_parse) {
    // This function just replaces fractions into single characters
    var fractions = {
        "1/2": "½", "1/3": "⅓", "2/3": "⅔", "1/4": "¼",
        "3/4": "¾", "1/5": "⅕", "2/5": "⅖", "3/5": "⅗",
        "4/5": "⅘", "1/6": "⅙", "5/6": "⅚", "1/7": "⅐",
        "1/8": "⅛", "3/8": "⅜", "5/8": "⅝", "7/8": "⅞",
        "1/9": "⅑", "1/10": "⅒"
    };
    var i;
    for (i in fractions) {
        while (to_parse.indexOf(i) != -1) to_parse = to_parse.replace(i, fractions[i]);
    }
    return to_parse;
}