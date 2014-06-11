//(
//    function(func) {
//    }
//)(window.func = window.func || {});

Array.prototype.clear = function() {
    this.splice(0, this.length);
};

Array.prototype.pushAll = function(arr, map) {
    for (var i = 0; i < arr.length; i++) {
        if (map)
            this.push(map(arr[i]));
        else
            this.push(arr[i]);
    }
};

Array.prototype.remove = function(obj) {
    var indx = this.indexOf(obj);
    this.splice(indx, 1);
};

Array.prototype.find = function(predicate, deflt) {
    for (var i = 0; i < this.length; i++) {
        if (predicate(this[i]))
            return this[i];
    }
    if (deflt)
        return deflt;
    return null;
};