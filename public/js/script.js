

window._conf = function($msg = '', $func = '', $params = []) {
    $('#confirm_modal #confirm').attr('onclick', $func + "(" + $params.join(',') + ")")
    $('#confirm_modal .modal-body').html($msg)
    $('#confirm_modal').modal('show')
}
$(function() {
    $('.summernote').each(function() {
        var _height = $(this).attr('data-height') || '20vh';
        var tabsize = $(this).attr('data-tabsize') || 2;
        var placeholder = $(this).attr('data-placeholder') || "Write something here.";
        $(this).summernote({
            placeholder: placeholder,
            tabsize: tabsize,
            height: _height,
            toolbar: [
                ['style', ['style']],
                ['font', ['bold', 'underline', 'clear']],
                ['color', ['color']],
                ['para', ['ul', 'ol', 'paragraph']],
                ['insert', ['link']],
                ['view', ['codeview']]
            ]
        })
    })
    $('.panel-heading.note-toolbar').addClass('bg-light border-bottom shadow ')
})