using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace SportsLeague.API.Serialization;

public sealed class NullableIsoDateTimeJsonConverter : JsonConverter<DateTime?>
{
    public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
        {
            return null;
        }

        var value = reader.GetString();

        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        if (!DateTime.TryParse(
                value,
                CultureInfo.InvariantCulture,
                DateTimeStyles.RoundtripKind | DateTimeStyles.AllowWhiteSpaces,
                out var parsed))
        {
            throw new JsonException("La fecha no tiene un formato valido.");
        }

        return parsed;
    }

    public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
    {
        if (!value.HasValue)
        {
            writer.WriteNullValue();
            return;
        }

        writer.WriteStringValue(value.Value.ToString("yyyy-MM-ddTHH:mm:ss", CultureInfo.InvariantCulture));
    }
}
