function TimestampString() {
    let date_ob = new Date();
    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    return date + '/' + month + '/' + year;
}

function MoneyString(money) {
    var copper = money % 100;
    money = Math.trunc(money / 100);
    var silver = money % 100;
    var gold = Math.trunc(money / 100);
    return gold + "g " + silver + "s " + copper + "c";
}

function IsSubstr(s1, s2) {
    let m = s1.length;
    let n = s2.length;
    for (var i = 0; i <= n - m; i++) {
        for (var j = 0; j < m; j++) {
            if (s2[i + j] != s1[j])
                break;
        }
        if (j == m)
            return true;
    }
    return false;
}

module.exports = { TimestampString, MoneyString, IsSubstr };