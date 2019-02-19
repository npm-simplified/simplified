require('../lib/load')({
    database: {
        type: 'mysql'
    }
});

// Simple conditions
let a = dbManager.conditions( {
    name: 'irene',
    age: 40
});
console.log(a);

// Simple $and
let b = dbManager.conditions({
    $and: {
        name: 'irene',
        age: 40
    }
});
console.log(b);

// Simple $or
let c = dbManager.conditions({
    $or: {
        name: 'irene',
        email: 'natasha@local.dev'
    }
});
console.log(c);

// $or in array
let d = dbManager.conditions({
    $or: [
        {name: 'allan'},
        {name: 'joe'}
    ]
});
console.log(d);
