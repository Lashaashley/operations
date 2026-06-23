$(document).ready(function() {
            

            $('.close').on('click', function() {
                const alert = $(this).closest('.custom-alert');
                alert.removeClass('show');
                setTimeout(() => {
                    alert.hide();
                }, 500);
            });

           $('#add-parent-form').on('submit', function(e) {
        e.preventDefault();
        $('.text-danger').html('');
        
        let formData = new FormData(this);
        const submitBtn = $(this).find('button[type="submit"]');
        const originalText = submitBtn.html();
        
        submitBtn.html('<i class="fa fa-spinner fa-spin"></i> Saving...').prop('disabled', true);
        
        $.ajax({
            url: $(this).data('action-url'), // Get URL from data attribute
            type: "POST",
            data: formData,
            contentType: false,
            processData: false,
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            },
            success: function(response) {
                showAlert('success', 'Success!', response.message);
                $('#add-parent-form')[0].reset();
            },
            error: function(xhr) {
                if (xhr.status === 422) {
                    let errors = xhr.responseJSON.errors;
                    $.each(errors, function(key, value) {
                        $('#' + key + '-error').html(value[0]);
                    });
                    showAlert('danger', 'Error!', 'Please check the form for errors.');
                } else {
                    showAlert('danger', 'Error!', 'Error adding Parent');
                }
            },
            complete: function() {
                submitBtn.html(originalText).prop('disabled', false);
            }
        });
    });
          

        });