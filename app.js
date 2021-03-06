//  Listeners
document.addEventListener('DOMContentLoaded', e => {
    
    allUsersDivLoading.style.display = 'block';
    getAllUsers();
    getAllWorkers();

});

//  Elements
const mapLoading            = document.querySelector('#map-loading');
const allUsersDiv           = document.querySelector('#all-users-div');
const allUsersDivLoading    = document.querySelector('.loader');
const allWorkersDiv         = document.querySelector('#all-workers-div');
const workerServicesDiv     = document.querySelector('#worker-services');
const workerServicesLoading = document.querySelector('#worker-services img');
const workerRequestsTable   = document.querySelector('#worker-requests tbody');
const currentWorker = {
    name: document.querySelector('#worker-name'),
    age: document.querySelector('#worker-age'),
    gender: document.querySelector('#worker-gender'),
    phone: document.querySelector('#worker-phone'),
    about: document.querySelector('#worker-about'),
    photo: document.querySelector('#worker-pic')
};

//  Notifications
var myNotus = notus();

//  Map
const RD = { lat: 18.4778244, lng: -69.929239 };
const PEDRO_BRAND = { lat: 18.5678899, lng: -70.103717 };
const GUERRA = { lat: 18.5519521, lng: -69.7135628 };

const locations = [
    RD,
    PEDRO_BRAND,
    GUERRA
];

//  Save every worker marker
const allWorkersMarkers = [];

var map;


//  Firebase
var config = {
    apiKey: "AIzaSyAgP53i4TZ8d0XUEJZPRkQPfU7IgLYC6MM",
    authDomain: "conconapp-e882d.firebaseapp.com",
    databaseURL: "https://conconapp-e882d.firebaseio.com",
    projectId: "conconapp-e882d",
    storageBucket: "conconapp-e882d.appspot.com",
    messagingSenderId: "980459836397"
};
firebase.initializeApp(config);
const db = firebase.database();


function initMap() {
    
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 8,
        center: RD
    });
    

}

function createMarker(user) {

    const userIcon = user.gender == 'M'? 'male' : 'female';

    var contentString = `
        <div class="">
            <h5>User datails</h5>
            <ul>
                <li>Name: ${user.name}</li>
                <li>Phone: ${user.phoneNumber}</li>
                <li>Age: ${user.age}</li>
                <li>Gender: ${user.gender}</li>               
            </ul>            
        </div>
    `;

    var infowindow = new google.maps.InfoWindow({
        content: contentString
    });

    var marker = new google.maps.Marker({
        position: user.location,
        map: map,
        icon: `icons/${userIcon}.png`,
        title: user.name
    });

    marker.addListener('click', () => {
        infowindow.open(map, marker);
    });
    map.setCenter(user.location);
    makeZoom();

    allWorkersMarkers.push(marker);
}

function makeZoom() {
    let zoom = map.zoom;
    if(zoom <= 14) {
        setTimeout(()=>{
            map.setZoom(zoom + 1);
            makeZoom();
        },150);

    }
}


function showNotification(message, title, duration, type) {
    if(!message) {
        console.error('!!Notificaion must have message!!');
        return false;
    }
    
    myNotus.send({
        notusType: 'toast',
        notusPosition: 'top',
        title: title || 'Simple notification',
        message: message,
        autoCloseDuration: duration || 2000,
        alertType: type || "success",
    });
}

// Create markers for users with no location
function createDummyMarkers(user) {
    const userIcon = user.gender == 'M'? 'white' : 'black';

    var contentString = `
        <div class="">
            <h5>User datails</h5>
            <ul>
                <li>Name: ${user.name}</li>
                <li>Phone: ${user.phoneNumber}</li>              
            </ul>            
        </div>
    `;

    var infowindow = new google.maps.InfoWindow({
        content: contentString
    });

    var marker = new google.maps.Marker({
        position: locations[count],
        map: map,
        icon: `icons/person_${userIcon}.png`,
        title: user.name
    });

    marker.addListener('click', () => {
        infowindow.open(map, marker);
    });   
}

var count = 0;

function getAllUsers() {
    

    db.ref('user_info').on('child_added', snapshot => {
        const user = snapshot.val();
        //paintUserToDiv(user);
        
        createDummyMarkers(user);
        count++;

        //console.log(user);
    });
    mapLoading.style.display = 'none';
}

function getAllWorkers() {
    

    db.ref('worker').on('child_added', snapshot => {
        const user = snapshot.val();
        paintWorkerToDiv(user);
        allUsersDivLoading.style.display = 'none';

    });



    
}

function getWorkerDetails(user) {
    return new Promise((resolve) => {
        db
        .ref(`worker_location/${user.phoneNumber}`)
        .once('value')
        .then(snapshot => {
            const data = snapshot.val();
            if(!data) {
                showNotification('Worker has no location');
                resolve(false);
            } else {
                const location = {
                    lat: parseFloat(data.latitude),
                    lng: parseFloat(data.longitude)
                }
                resolve(location);
                user.location = location;
                createMarker(user);
            }       
        }).catch(err => console.error(err));
    });   
}

function getWorkerRequests(phone) {
    //worker-requests
    db
    .ref(`user_request/${phone}`)
    .on('child_added', snapshot => {
       
        const data = snapshot.val();
        if(!data) {
            showNotification('Worker has no requests');
            return false;
        } else {
            console.log('requests ',data);
            paintWorkerRequests(data);

        }       
    }, err => console.log('ERR ', err));
}

function getWorkerServices(phone){
    cleanServiceDiv();
    workerServicesLoading.style.display = 'block';
    
    db
    .ref(`worker_service/${phone}`)
    .on('child_added', snapshot => {
        
        const data = snapshot.val();
        if(!data) {
            showNotification('Worker has no services');
            return false;
        } else {
            
            paintWorkerService(data);

        }       
    }, err => console.log('ERR ', err));
}


function paintWorkerService(data) {

    const div = document.createElement('div');
    div.className = 'list-group-item list-group-item-action';
    div.innerHTML = `
    <div class="row">
        <div class="col-sm-12"><b>${data.name}</b></div>
    </div>
    <div class="row">
        <div class="col-sm-9"><i>${data.description || 'No description'}</i></div>
        <div class="col-sm-3 text-primary">$${data.price}</div>      
    </div>`;

    workerServicesDiv.appendChild(div);
    workerServicesLoading.style.display = 'none';
}


function paintWorkerRequests(data) {
    let status = '';
    if(data.status == 0) {
        status = '<span class="badge badge-success">Accepted</span>';
    } else if(data.status == 1) {
        status = '<span class="badge badge-warning">Pendding</span>'; 
    } else if(data.status == 2) {
        status = '<span class="badge badge-danger">Declined</span>';
    }
    const requestContent = `
        <tr>
            <td>${data.date}</td>
            <td>${data.userId}</td>
            <td>${data.msg.substring(0,30)}</td>
            <td>${status}</td>
        </tr>
    `;

    workerRequestsTable.innerHTML = requestContent;   
}

function cleanServiceDiv() {
    if(workerServicesDiv.hasChildNodes()) {
        
        if(workerServicesDiv.lastChild.className != 'loading-img') {
            workerServicesDiv.removeChild(workerServicesDiv.lastChild);
            cleanServiceDiv(); 
        }
    }  
}


//allWorkersDiv

function paintWorkerToDiv(user) {

    const div = document.createElement('div');
    const list = document.createElement('div');
    const divLeft = document.createElement('div');
    const divRight = document.createElement('div'); 
    const linkToProfile = document.createElement('a');
    const linkToMap = document.createElement('a');

    list.className = 'list-group-item';
    
    div.className = 'row';

    divLeft.className = 'col-sm-9';
    divRight.className = 'col-sm-2';
    
    linkToProfile.setAttribute('href', '#');
    linkToProfile.textContent = user.name;
    linkToProfile.addEventListener('click', e => {
        e.preventDefault();
        showWorkerDetails(user);
    });

    linkToMap.setAttribute('href', '#');
    linkToMap.setAttribute('title', 'Show on map');
    linkToMap.classList.add('text-right');
    linkToMap.innerHTML = '<i class="fas fa-thumbtack text-success"></i>';
    linkToMap.addEventListener('click', e => {
        getWorkerDetails(user);
    });

    divLeft.appendChild(linkToProfile);
    divRight.appendChild(linkToMap);

    div.appendChild(divLeft);
    div.appendChild(divRight);

    list.appendChild(div);

    allWorkersDiv.appendChild(list);

}


function paintUserToDiv(user) {

    const item = document.createElement('a');
    item.className = 'list-group-item list-group-item-action';
    item.innerHTML = `${user.name} ->  <span class="badge badge-primary badge-pill">${user.gender.toUpperCase()}</span>`;
    item.setAttribute('href', '#');

    allUsersDiv.appendChild(item);

}


function showWorkerDetails(user) {
    //console.log(user);

    currentWorker.name.value = user.name;
    currentWorker.about.value = user.about;
    currentWorker.age.value = user.age;
    currentWorker.gender.value = user.gender;
    currentWorker.phone.value = user.phoneNumber;
    currentWorker.photo.setAttribute('src', `data:image/*;base64,${user.photo}`);

    //  get worker services and requests
    getWorkerServices(user.phoneNumber);
    getWorkerRequests(user.phoneNumber);

    $('#worker-modal').modal();
}