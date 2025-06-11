# Uploading Multiple Files on a ModelForm

<!-- start -->

I was recently making changes on the admin site that is offered by Django. The app I'm working on is an AirBnB type site for the AirBnB's that my girlfriend and I want make available to guests. My goal was to create a form to allow admins to upload multiple images
of a house at once. This turned out to be a very difficult task (mainly because instead of reading the docs like I should have, I went to StackOverFlow for quick answers).

Here's how I went about it.

### models.py

```python
from django.db import models

class Location(models.Model):

    street_adress = models.CharField(max_length=100)
    city = models.CharField(max_length=50)
    state = models.CharField(max_length=3)
    zip_code = models.PositiveIntegerField()
    name = models.CharField(max_length=100)
    description = models.TextField()
    current_rate = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return self.name


class LocationImage(models.Model):

    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="location_images/")
```

As you can see, there's a **one-to-many** relationship between the Location and LocationImage models (one location can have many images).
This is defined by the `models.ForeignKey` field, `location`. `LocationImage` also has a `models.ImageField` with `upload_to` set to the
path where we want the images uploaded.

The next step was defining custom forms that we can register on the admin site and associate with models.

### forms.py

```python
from django import forms

from bookings.models import Location, LocationImage

class MultiFileInput(forms.ClearableFileInput):
    allow_multiple_selected = True


class MultiFileField(forms.Field):

    def __init__(self, *args, **kwargs):
        kwargs.setdefault("widget", MultiFileInput())
        kwargs.setdefault("required", False)

        super().__init__(*args, **kwargs)

    def clean(self, data):
        single_file_clean = super().clean
        if isinstance(data, (list, tuple)):
            result = [single_file_clean(d) for d in data]
        else:
            result = [single_file_clean(data)]

        return result


class MultiLocationImageUploadForm(forms.ModelForm):

    images = MultiFileField()

    class Meta:

        model = Location
        fields = '__all__'


    def save(self, commit=True):

        instance = super().save(commit)

        if self.files:
            for image_file in self.files.getlist('images'):
                LocationImage.objects.create(location=instance, image=image_file)

        return instance
```

Note that we needed to override the `save` method on the `MultiLocationImageUploadForm`. This allows us to associate
the images with the instance that's returned by the `Location` instance that gets returned from `super().save(commit)`.

Now we update the `admin.py` module to register the custom form with the admin site.

```python
from django.contrib import admin

from .models import Location
from .forms import MultiLocationImageUploadForm

# Register your models here.

class LocationAdmin(admin.ModelAdmin):
    form = MultiLocationImageUploadForm


admin.site.register(Location, LocationAdmin)
```

The final step is defining the media paths in the `settings.py` module:

### settings.py (project level)

```python
# Paths for media storage (images)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
```

Also be sure to make these paths available so the app knows where to find them:

### urls.py (project level)

```python
# ...
from django.conf.urls.static import static

urlpatterns = [
    # ...
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

And that's all it takes from the admin side of things. Now we can upload multiple images of a house at once. Makes for a much better user experience.

## A Deeper Look at the Django Source Code

This is what I was trying to do before I came to the solution above:

### forms.py

```python
from django import forms

from bookings.models import Location, LocationImage

class MultiFileInput(forms.ClearableFileInput):
    allow_multiple_selected = True


class MultiLocationImageUploadForm(forms.ModelForm):

    # images = MultiFileField() ; no longer using the custom file field we created before

    images = forms.FileField(
        widget=MultiFileInput(attrs={'multiple': True}),
        required=False
    )

    class Meta:

        model = Location
        fields = '__all__'


    def save(self, commit=True):

        instance = super().save(commit)

        if self.files:
            for image_file in self.files.getlist('images'):
                LocationImage.objects.create(location=instance, image=image_file)

        return instance
```

As you can see, I was attempting to use a FileField to define the `images` field. This resulted in the following
error in the admin UI.

### Django Admin UI Error

![Error message in admin UI](images/error-message-django-admin-ui.png)

A deeper look at the Django source code revealed why this was happening. Let's step through what exactly happens when we register the
Location model with the custom LocationAdmin.

Executing `admin.site.register(Location, LocationAdmin)` triggers the following code:

```python
# class AdminSite ...
    def register(self, model_or_iterable, admin_class=None, **options):
        """
        Register the given model(s) with the given admin class.

        The model(s) should be Model classes, not instances.

        If an admin class isn't given, use ModelAdmin (the default admin
        options). If keyword arguments are given -- e.g., list_display --
        apply them as options to the admin class.

        If a model is already registered, raise AlreadyRegistered.

        If a model is abstract, raise ImproperlyConfigured.
        """
        admin_class = admin_class or ModelAdmin
        if isinstance(model_or_iterable, ModelBase):
            model_or_iterable = [model_or_iterable]
        for model in model_or_iterable:
            if model._meta.abstract:
                raise ImproperlyConfigured(
                    "The model %s is abstract, so it cannot be registered with admin."
                    % model.__name__
                )
            if model._meta.is_composite_pk:
                raise ImproperlyConfigured(
                    "The model %s has a composite primary key, so it cannot be "
                    "registered with admin." % model.__name__
                )

            if self.is_registered(model):
                registered_admin = str(self.get_model_admin(model))
                msg = "The model %s is already registered " % model.__name__
                if registered_admin.endswith(".ModelAdmin"):
                    # Most likely registered without a ModelAdmin subclass.
                    msg += "in app %r." % registered_admin.removesuffix(".ModelAdmin")
                else:
                    msg += "with %r." % registered_admin
                raise AlreadyRegistered(msg)

            # Ignore the registration if the model has been
            # swapped out.
            if not model._meta.swapped:
                # If we got **options then dynamically construct a subclass of
                # admin_class with those **options.
                if options:
                    # For reasons I don't quite understand, without a __module__
                    # the created class appears to "live" in the wrong place,
                    # which causes issues later on.
                    options["__module__"] = __name__
                    admin_class = type(
                        "%sAdmin" % model.__name__, (admin_class,), options
                    )

                # Instantiate the admin class to save in the registry
                self._registry[model] = admin_class(model, self)
```

Ultimately, the `model` becomes a key in the `self._registry` attribute and the admin class becomes its value.

The `self._registry` dictionary is used during the `get_urls()` method, defined here:

```python
# class AdminSite...
    def get_urls(self):
        # Additional method code redacted...

        # Add in each model's views, and create a list of valid URLS for the
        # app_index
        valid_app_labels = []
        for model, model_admin in self._registry.items():
            urlpatterns += [
                path(
                    "%s/%s/" % (model._meta.app_label, model._meta.model_name),
                    include(model_admin.urls),
                ),
            ]
            if model._meta.app_label not in valid_app_labels:
                valid_app_labels.append(model._meta.app_label)

        # If there were ModelAdmins registered, we should have a list of app
        # labels for which we need to allow access to the app_index view,
        if valid_app_labels:
            regex = r"^(?P<app_label>" + "|".join(valid_app_labels) + ")/$"
            urlpatterns += [
                re_path(regex, wrap(self.app_index), name="app_list"),
            ]

        if self.final_catch_all_view:
            urlpatterns.append(re_path(r"(?P<url>.*)$", wrap(self.catch_all_view)))

        return urlpatterns
```

Each model gets urls assigned to it as defined in the model admins urls attribute, defined here:

```python
# class ModelAdmin...
    def get_urls(self):
        from django.urls import path

        def wrap(view):
            def wrapper(*args, **kwargs):
                return self.admin_site.admin_view(view)(*args, **kwargs)

            wrapper.model_admin = self
            return update_wrapper(wrapper, view)

        info = self.opts.app_label, self.opts.model_name

        return [
            path("", wrap(self.changelist_view), name="%s_%s_changelist" % info),
            path("add/", wrap(self.add_view), name="%s_%s_add" % info),
            path(
                "<path:object_id>/history/",
                wrap(self.history_view),
                name="%s_%s_history" % info,
            ),
            path(
                "<path:object_id>/delete/",
                wrap(self.delete_view),
                name="%s_%s_delete" % info,
            ),
            path(
                "<path:object_id>/change/",
                wrap(self.change_view),
                name="%s_%s_change" % info,
            ),
            # For backwards compatibility (was the change url before 1.9)
            path(
                "<path:object_id>/",
                wrap(
                    RedirectView.as_view(
                        pattern_name="%s:%s_%s_change"
                        % ((self.admin_site.name,) + info)
                    )
                ),
            ),
        ]

    @property
    def urls(self):
        return self.get_urls()
```

This is where the common endpoints for updating an object are mapped to the views defind by the admin site:

Ex. "<path:object_id>/change/" is mapped to `self.change_view` on `ModelAdmin`.

`ModelAdmin.change_view` is defined below:

```python
# class ModelAdmin...
    def change_view(self, request, object_id, form_url="", extra_context=None):
        return self.changeform_view(request, object_id, form_url, extra_context)
```

`ModelAdmin.changeform_view` is defined below:

```python
# class ModelAdmin...
    @csrf_protect_m
    def changeform_view(self, request, object_id=None, form_url="", extra_context=None):
        if request.method in ("GET", "HEAD", "OPTIONS", "TRACE"):
            return self._changeform_view(request, object_id, form_url, extra_context)

        with transaction.atomic(using=router.db_for_write(self.model)):
            return self._changeform_view(request, object_id, form_url, extra_context)
```

`ModelAdmin._changeform_view` is defined below:

```python
# class ModelAdmin...
    def _changeform_view(self, request, object_id, form_url, extra_context):
        # additional code ommitted...

        fieldsets = self.get_fieldsets(request, obj)
        ModelForm = self.get_form(
            request, obj, change=not add, fields=flatten_fieldsets(fieldsets)
        )
        if request.method == "POST":
            form = ModelForm(request.POST, request.FILES, instance=obj)
            formsets, inline_instances = self._create_formsets(
                request,
                form.instance,
                change=not add,
            )
            form_validated = form.is_valid()
            if form_validated:
                new_object = self.save_form(request, form, change=not add)
            else:
                new_object = form.instance

            # additional code ommitted...

        context = {
            **self.admin_site.each_context(request),
            "title": title % self.opts.verbose_name,
            "subtitle": str(obj) if obj else None,
            "adminform": admin_form,
            "object_id": object_id,
            "original": obj,
            "is_popup": IS_POPUP_VAR in request.POST or IS_POPUP_VAR in request.GET,
            "to_field": to_field,
            "media": media,
            "inline_admin_formsets": inline_formsets,
            "errors": helpers.AdminErrorList(form, formsets),
            "preserved_filters": self.get_preserved_filters(request),
        }

        # Hide the "Save" and "Save and continue" buttons if "Save as New" was
        # previously chosen to prevent the interface from getting confusing.
        if (
            request.method == "POST"
            and not form_validated
            and "_saveasnew" in request.POST
        ):
            context["show_save"] = False
            context["show_save_and_continue"] = False
            # Use the change template instead of the add template.
            add = False

        context.update(extra_context or {})

        return self.render_change_form(
            request, context, add=add, change=not add, obj=obj, form_url=form_url
        )
```

This is a very long function but the key part is the moment the `form` object is created and its `is_valid` method called.

```python
        # ...
        ModelForm = self.get_form(
            request, obj, change=not add, fields=flatten_fieldsets(fieldsets)
        )
        if request.method == "POST":
            form = ModelForm(request.POST, request.FILES, instance=obj)
            formsets, inline_instances = self._create_formsets(
                request,
                form.instance,
                change=not add,
            )
            form_validated = form.is_valid()
        # ...
```

The call to `self.get_form` returns a `modelform_factory`:

```python
# class ModelAdmin...
    def get_form(self, request, obj=None, change=False, **kwargs):
        """
        Return a Form class for use in the admin add view. This is used by
        add_view and change_view.
        """
        if "fields" in kwargs:
            fields = kwargs.pop("fields")
        else:
            fields = flatten_fieldsets(self.get_fieldsets(request, obj))
        excluded = self.get_exclude(request, obj)
        exclude = [] if excluded is None else list(excluded)
        readonly_fields = self.get_readonly_fields(request, obj)
        exclude.extend(readonly_fields)
        # Exclude all fields if it's a change form and the user doesn't have
        # the change permission.
        if (
            change
            and hasattr(request, "user")
            and not self.has_change_permission(request, obj)
        ):
            exclude.extend(fields)
        if excluded is None and hasattr(self.form, "_meta") and self.form._meta.exclude:
            # Take the custom ModelForm's Meta.exclude into account only if the
            # ModelAdmin doesn't define its own.
            exclude.extend(self.form._meta.exclude)
        # if exclude is an empty list we pass None to be consistent with the
        # default on modelform_factory
        exclude = exclude or None

        # Remove declared form fields which are in readonly_fields.
        new_attrs = dict.fromkeys(
            f for f in readonly_fields if f in self.form.declared_fields
        )
        form = type(self.form.__name__, (self.form,), new_attrs)

        defaults = {
            "form": form,
            "fields": fields,
            "exclude": exclude,
            "formfield_callback": partial(self.formfield_for_dbfield, request=request),
            **kwargs,
        }

        if defaults["fields"] is None and not modelform_defines_fields(
            defaults["form"]
        ):
            defaults["fields"] = forms.ALL_FIELDS

        try:
            return modelform_factory(self.model, **defaults)
        except FieldError as e:
            raise FieldError(
                "%s. Check fields/fieldsets/exclude attributes of class %s."
                % (e, self.__class__.__name__)
            )
```

As the docustring states, this method returns a Form for use in the admin site's `add` and `change` views.

A key part is that a `form` type is defined in this method:

```python
        # ...
        form = type(self.form.__name__, (self.form,), new_attrs)

        defaults = {
            "form": form,
            "fields": fields,
            "exclude": exclude,
            "formfield_callback": partial(self.formfield_for_dbfield, request=request),
            **kwargs,
        }
        # ...
```

`self.form` is the `form` attribute we set earlier in the custom `LocationAdmin`:

### admin.py

```python
class LocationAdmin(admin.ModelAdmin):
    form = MultiLocationImageUploadForm
```

`modelform_factory` is what ultimately instantiates an instance of the ModelForm.

```python
def modelform_factory(
    model,
    form=ModelForm,
    fields=None,
    exclude=None,
    formfield_callback=None,
    widgets=None,
    localized_fields=None,
    labels=None,
    help_texts=None,
    error_messages=None,
    field_classes=None,
):
    """
    Return a ModelForm containing form fields for the given model. You can
    optionally pass a `form` argument to use as a starting point for
    constructing the ModelForm.

    ``fields`` is an optional list of field names. If provided, include only
    the named fields in the returned fields. If omitted or '__all__', use all
    fields.

    ``exclude`` is an optional list of field names. If provided, exclude the
    named fields from the returned fields, even if they are listed in the
    ``fields`` argument.

    ``widgets`` is a dictionary of model field names mapped to a widget.

    ``localized_fields`` is a list of names of fields which should be localized.

    ``formfield_callback`` is a callable that takes a model field and returns
    a form field.

    ``labels`` is a dictionary of model field names mapped to a label.

    ``help_texts`` is a dictionary of model field names mapped to a help text.

    ``error_messages`` is a dictionary of model field names mapped to a
    dictionary of error messages.

    ``field_classes`` is a dictionary of model field names mapped to a form
    field class.
    """
    # Create the inner Meta class. FIXME: ideally, we should be able to
    # construct a ModelForm without creating and passing in a temporary
    # inner class.

    # Build up a list of attributes that the Meta object will have.
    attrs = {"model": model}
    if fields is not None:
        attrs["fields"] = fields
    if exclude is not None:
        attrs["exclude"] = exclude
    if widgets is not None:
        attrs["widgets"] = widgets
    if localized_fields is not None:
        attrs["localized_fields"] = localized_fields
    if labels is not None:
        attrs["labels"] = labels
    if help_texts is not None:
        attrs["help_texts"] = help_texts
    if error_messages is not None:
        attrs["error_messages"] = error_messages
    if field_classes is not None:
        attrs["field_classes"] = field_classes

    # If parent form class already has an inner Meta, the Meta we're
    # creating needs to inherit from the parent's inner meta.
    bases = (form.Meta,) if hasattr(form, "Meta") else ()
    Meta = type("Meta", bases, attrs)
    if formfield_callback:
        Meta.formfield_callback = staticmethod(formfield_callback)
    # Give this new form class a reasonable name.
    class_name = model.__name__ + "Form"

    # Class attributes for the new form class.
    form_class_attrs = {"Meta": Meta}

    if getattr(Meta, "fields", None) is None and getattr(Meta, "exclude", None) is None:
        raise ImproperlyConfigured(
            "Calling modelform_factory without defining 'fields' or "
            "'exclude' explicitly is prohibited."
        )

    # Instantiate type(form) in order to use the same metaclass as form.
    return type(form)(class_name, (form,), form_class_attrs)
```

The `ModelForm` extends the `BaseForm` class which defines an `errors` property that gets invoked during the `form.is_valid()` call.
`errors` calls `self.full_clean`:

```python
# ...
    @property
    def errors(self):
        """Return an ErrorDict for the data provided for the form."""
        if self._errors is None:
            self.full_clean()
        return self._errors
# ...
```

`self.full_clean` calls `self._clean_fields` which iterates through all the fields in the form and calls their `_clean_bound_field`
method. If there's an error, it gets added to the errors.

```python
# ...
    def _clean_fields(self):
        for name, bf in self._bound_items():
            field = bf.field
            try:
                self.cleaned_data[name] = field._clean_bound_field(bf)
                if hasattr(self, "clean_%s" % name):
                    value = getattr(self, "clean_%s" % name)()
                    self.cleaned_data[name] = value
            except ValidationError as e:
                self.add_error(name, e)
# ...
```

We went through a lot of django source code, so now would be a good time to remember the erroneous custom ModelForm we created:

```python
class MultiLocationImageUploadForm(forms.ModelForm):

    # images = MultiFileField() ; no longer using the custom file field we created before

    images = forms.FileField(
        widget=MultiFileInput(attrs={'multiple': True}),
        required=False
    )

    class Meta:

        model = Location
        fields = '__all__'


    def save(self, commit=True):

        instance = super().save(commit)

        if self.files:
            for image_file in self.files.getlist('images'):
                LocationImage.objects.create(location=instance, image=image_file)

        return instance
```

So when its time for this form to be processed by the admin view, each bound field will be iterated through and cleaned.
We are defining `images` as a `forms.FileField`. The `forms.FieldField` class has a clean method that calls `self.to_python`. We can
also see here where the error message is defined ("No file was submitted. Check the encoding type on the form.").

### django.forms.fields.py

```python
class FileField(Field):
    widget = ClearableFileInput
    default_error_messages = {
        "invalid": _("No file was submitted. Check the encoding type on the form."),
        "missing": _("No file was submitted."),
        "empty": _("The submitted file is empty."),
        "max_length": ngettext_lazy(
            "Ensure this filename has at most %(max)d character (it has %(length)d).",
            "Ensure this filename has at most %(max)d characters (it has %(length)d).",
            "max",
        ),
        "contradiction": _(
            "Please either submit a file or check the clear checkbox, not both."
        ),
    }

    def __init__(self, *, max_length=None, allow_empty_file=False, **kwargs):
        self.max_length = max_length
        self.allow_empty_file = allow_empty_file
        super().__init__(**kwargs)

    def to_python(self, data):
        if data in self.empty_values:
            return None

        # UploadedFile objects should have name and size attributes.
        try:
            file_name = data.name
            file_size = data.size
        except AttributeError:
            raise ValidationError(self.error_messages["invalid"], code="invalid")
```

The issue is that the `data` that `FileField` is expecting is a single file but we're trying to pass a list of file objects to it. So
when it tries to access `data.name` and `data.size`, the AttributeError is thrown with the "invalid" error message since python lists
don't have `name` and `size` attributes.

Thus, to get around this we needed to define an entirely custom Field object to handle the multi file upload and assign `images` to that
instead of the builtin `FileField`.

```python
class MultiFileField(forms.Field):

    def __init__(self, *args, **kwargs):
        kwargs.setdefault("widget", MultiFileInput())
        kwargs.setdefault("required", False)

        super().__init__(*args, **kwargs)

    def clean(self, data):
        single_file_clean = super().clean
        if isinstance(data, (list, tuple)):
            result = [single_file_clean(d) for d in data]
        else:
            result = [single_file_clean(data)]

        return result


class MultiLocationImageUploadForm(forms.ModelForm):

    images = MultiFileField()
    # ...
```
