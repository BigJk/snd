# Templates

A template defines the look of a print-out and contains entries that can be printed.
Templates are 'designed' in HTML and CSS and the data is inserted via a templating
engine called [Nunjuks](https://mozilla.github.io/nunjucks/).

Using HTML and CSS makes it possible to use all the nice and convenient layout and style
options that they have to offer and even include any common framework you might need 
(e.g. Fontawesome for Icons). This can greatly speedup the template creation process.

----

## Learning

If you are new to HTML, CSS and the likes a good starting point might be:

- HTML: [HTML Introduction](https://www.w3schools.com/html/html_intro.asp)
- CSS: [Getting started with CSS](https://developer.mozilla.org/en-US/docs/Learn/CSS/First_steps/Getting_started)
- Nunjucks: [Templating](https://mozilla.github.io/nunjucks/templating.html)

----

In the following section a brief introduction to the tabs found in the template
creation will be given:


# Basic Information

Here basic information for the template, like a name and description that will be shown in
the template list are set.

### Author & Slug

It's important to know that templates will be identified by author and slug. Both are allowed
to contain alphanumeric (``a-z A-Z 0-9``) and the ``-`` character. You can think about the slug as a simplified 
name that is used for identification instead of looking nice to display.

**Example:** If you want a template containing Magic Items you might set the name to ``Magic Items``,
the Author to ``YourUsername`` and the slug to ``magic-items``.

With the help of author and slug it is easier to share templates and update them when importing.

----

# Images

It is possible to attach images to a template. Imagine you want to add a border to your template.
Here is the right place to add these images. If you added an image it is possible to access it
in a template via the ``images`` variable.

### Example

```html
<img src="{{ images['your_image.png'] }}" alt="">
```

----

# Data Sources

Data sources are collection of entries (data) that can be linked to templates.
An example would be a list of Monsters or Magic Items. Any data source that you want to link
to this template can be selected here.

----

# Skeleton Data

The skeleton data is like an example entry that is used for template editing and entry creation.
It is encoded as [json](https://en.wikipedia.org/wiki/JSON). Depending on the type and value of a
property a different input will be shown in the entry creation and editing.

### — Type: Text

If a property is a text like the ``description`` in the following example a normal text input
will be shown.

```json
{
  "description": "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam"
}
```

### — Type: Number 

If a property is a number like the ``hp`` in the following example a number input will be shown.

```json
{
  "hp": 120
}
```

### — Type: List

If a property is a list (array) like the ``attacks`` in the following example it will be possible
to create and remove list items with editable ``name`` and ``damage`` values.

```json
{
  "attacks": [
    {
      "name": "Bite",
      "damage": 20
    }
  ]
}
```

List of basic types will also work.

```json
{
  "attacks": [ "Bite", "Slash" ]
}
```

### — Type: Image

If any text property contains the text ``!IMAGE`` like the ``icon`` property in the following
example a image input will be shown.

```json
{
  "icon": "!IMAGE"
}
```

To use it as an image in your template:

```html
<img src="{{ it.icon }}" alt="">
```

### Full Example

A skeleton for a weapon could be the following:

```json
{
  "category": "Martial Melee Weapons",
  "cost": "10 gp",
  "damage_dice": "1d8",
  "damage_type": "slashing",
  "name": "Battleaxe",
  "properties": [
    "versatile (1d10)"
  ],
  "weight": "4 lb."
}
```

### Merge Utilities

If you edit a template and the template has data sources attached to them, you can use the merge
utilities to quickly generate a skeleton data. Let's imagine you imported a data source containing
monsters and don't want to define the skeleton yourself. You can just use the **Merge All** button
and Sales & Dungeons will try to produce an optimal skeleton data from the entries, so you can focus
on building a cool template!

----

# Templates

A template contains two nunjucks templates. One that defines how the print-out should look, which is
called the **Print Template** and one called **List Template** that defines additional information that should
be shown under each entry in the template entry list.

## Hotkeys

In the template editors following hotkeys are available:

- ``Ctrl+Space``: Open Hint
- ``Ctrl+G``: Open Snippets

## Variables

You will be able to access the data of the data skeleton or the selected entry in the template.
To access the data by using the nunjucks variable syntax. Let's imagine you have the following 
data skeleton or selected entry data:

```json
{
  "name": "Cool Name"
}
```

To access the name property in the nunjucks html template you just need to write

```html
<span>Name: {{ it.name }}</span>
```

## Additional Variables

### Printer Settings

The printer settings you set are also available in the template under the ``settings`` variable.
Using the ``settings.printerWidth`` setting is especially useful to change your design depending
on the size of the printer. Most printer will either have a 58mm or 80mm print area, so it's wise
to adopt your template to both sizes.

### Images

Any image that you saved inside your template will be available under the ``images`` variable.

```html
<img src="{{ images['your_image.png'] }}" alt="">
```
