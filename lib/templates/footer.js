'use strict';

module.exports = `<script>
    const source = new EventSource('/events/');
    source.onmessage = function (e) {
        console.log('msg', e.data);
        if (e.data === '"refresh"') location.reload();
    };
</script>
<style>
    ul > li {margin-top:0;margin-bottom:0.1em;}
    .smalltext {font-size:0.7em;}
</style>`;

