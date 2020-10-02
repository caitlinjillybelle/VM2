/*global WilboWaggins _config*/

var WilboWaggins = window.WilboWaggins || {};
WilboWaggins.map = WilboWaggins.map || {};

(function rideScopeWrapper($) {
    var authToken;
    WilboWaggins.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
        } else {
            window.location.href = '/signin.html';
        }
    }).catch(function handleTokenError(error) {
        alert(error);
        window.location.href = '/signin.html';
    });
    function requestDog(pickupLocation) {
        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/walk',
            headers: {
                Authorization: authToken
            },
            data: JSON.stringify({
                PickupLocation: {
                    Latitude: pickupLocation.latitude,
                    Longitude: pickupLocation.longitude
                }
            }),
            contentType: 'application/json',
            success: completeRequest,
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error requesting walk: ', textStatus, ', Details: ', errorThrown);
                console.error('Response: ', jqXHR.responseText);
                alert('An error occured when requesting your dog:\n' + jqXHR.responseText);
            }
        });
    }

    function completeRequest(result) {
        var dog;
        var pronoun;
        console.log('Response received from API: ', result);
        dog = result.Dog;
        pronoun = dog.Gender === 'Male' ? 'his' : 'her';
        displayUpdate(dog.Name + ', your ' + dog.Color + ' dog, is on ' + pronoun + ' way.');
        animateArrival(function animateCallback() {
            displayUpdate(dog.Name + ' has arrived. Bow Wow!');
            WilboWaggins.map.unsetLocation();
            $('#request').prop('disabled', 'disabled');
            $('#request').text('Set Pickup');
        });
    }

    // Register click handler for #request button
    $(function onDocReady() {
        $('#request').click(handleRequestClick);
        $(WilboWaggins.map).on('pickupChange', handlePickupChanged);

        WilboWaggins.authToken.then(function updateAuthMessage(token) {
            if (token) {
                displayUpdate('You are authenticated. Click to see your <a href="#authTokenModal" data-toggle="modal">auth token</a>.');
                $('.authToken').text(token);
            }
        });

        if (!_config.api.invokeUrl) {
            $('#noApiMessage').show();
        }
    });

    function handlePickupChanged() {
        var requestButton = $('#request');
        requestButton.text('Request Dog');
        requestButton.prop('disabled', false);
    }

    function handleRequestClick(event) {
        var pickupLocation = WilboWaggins.map.selectedPoint;
        event.preventDefault();
        requestDog(pickupLocation);
    }

    function animateArrival(callback) {
        var dest = WilboWaggins.map.selectedPoint;
        var origin = {};

        if (dest.latitude > WilboWaggins.map.center.latitude) {
            origin.latitude = WilboWaggins.map.extent.minLat;
        } else {
            origin.latitude = WilboWaggins.map.extent.maxLat;
        }

        if (dest.longitude > WilboWaggins.map.center.longitude) {
            origin.longitude = WilboWaggins.map.extent.minLng;
        } else {
            origin.longitude = WilboWaggins.map.extent.maxLng;
        }

        WilboWaggins.map.animate(origin, dest, callback);
    }

    function displayUpdate(text) {
        $('#updates').append($('<li>' + text + '</li>'));
    }
}(jQuery));
