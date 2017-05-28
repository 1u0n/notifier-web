function onChangeExpect(select) {
    var value = select.options[select.selectedIndex].value;
    if (value == 1) {
        for (var item of select.parentElement.querySelectorAll('.listOption'))
            item.disabled = false;
        for (var item of select.parentElement.querySelectorAll('.valueOption'))
            item.disabled = true;

        var triggerElem = select.parentElement.querySelector('select[name="trigger"]');
        triggerElem.selectedIndex = 6;
        triggerElem.onchange();
    } else {
        for (var item of select.parentElement.querySelectorAll('.listOption'))
            item.disabled = true;
        for (var item of select.parentElement.querySelectorAll('.valueOption'))
            item.disabled = false;

        var triggerElem = select.parentElement.querySelector('select[name="trigger"]');
        triggerElem.selectedIndex = 0;
        triggerElem.onchange();
    }
}

function onChangeTrigger(select) {
    var value = select.options[select.selectedIndex].value;
    if (value == 0 || value == 6) {
        select.parentElement.querySelector('input[name="condition"]').value = "";
        select.parentElement.querySelector('input[name="condition"]').style.visibility = "hidden";
    } else
        select.parentElement.querySelector('input[name="condition"]').style.visibility = "visible";
}

function onChangeCheck(select) {
    var value = select.options[select.selectedIndex].value;
    if (value == 0) {
        select.parentElement.querySelector('span').innerHTML = "minutes";
        select.parentElement.querySelector('input[name="time"]').value = "10";
    } else {
        select.parentElement.querySelector('span').innerHTML = "every day";
        select.parentElement.querySelector('input[name="time"]').value = "17:00";
    }
}

function testAgent(event, button) {
    event.preventDefault();
    var imgLoading = button.querySelector('img.loading');
    imgLoading.style.display = "inline";

    var form = button.parentElement.parentElement;
    var url = encodeURIComponent(form.querySelector('input[name="url"]').value);
    var selector = encodeURIComponent(form.querySelector('input[name="selector"]').value);
    var expect = encodeURIComponent(form.querySelector('select[name="expect"]').selectedIndex);
    var request = new XMLHttpRequest();
    request.onload = function(e) {
        imgLoading.style.display = "none";
        if (this.status == 200) {
            alert("Result found:\n\n" + this.responseText);
        } else if (this.status == 400) {
            alert("Error: " + this.responseText);
        } else {
            alert("Error " + this.status + " occurred while trying to test agent:\n" + this.responseText);
        }
    }
    request.open("POST", "/testAgent");
    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    request.send("url=" + url + "&selector=" + selector + "&expect=" + expect);
}


function logout() {
    window.location.replace('/logout');
}